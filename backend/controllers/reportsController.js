// backend/controllers/reportsController.js
import Distribution from "../models/Distribution.js";
import Medicine from "../models/Medicine.js";
import Stock from "../models/stock.js";
import OfficerInventory from "../models/OfficerInventory.js";
import RestockRequest from "../models/RestockRequest.js";
import DailyUsage from "../models/DailyUsage.js";
import User from "../models/User.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";

// Helper function to get date range
const getDateRange = (days) => {
  const endDate = new Date();
  const startDate = new Date();
  
  if (days === 'all') {
    startDate.setFullYear(2000); // Get all historical data
  } else {
    startDate.setDate(startDate.getDate() - parseInt(days));
  }
  
  return { startDate, endDate };
};

// GET /api/reports/overview - Complete overview statistics
export const getOverview = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(days);

    // Parallel execution for better performance
    const [
      totalDistributions,
      totalMedicines,
      totalOfficers,
      totalStock,
      lowStockCount,
      expiringCount,
      pendingRequests,
      acceptanceRate,
      totalQuantityDistributed
    ] = await Promise.all([
      // Total distributions in period
      Distribution.count({
        where: {
          date: { [Op.between]: [startDate, endDate] }
        }
      }),
      
      // Total unique medicines
      Medicine.count(),
      
      // Total active officers
      User.count({ where: { role: "OFFICER" } }),
      
      // Total stock available
      Stock.sum('quantityAvailable'),
      
      // Low stock medicines (< 20% available)
      Stock.findAll({
        attributes: [
          'medicineId',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
          [sequelize.fn('SUM', sequelize.col('quantityAvailable')), 'totalAvailable']
        ],
        group: ['medicineId'],
        raw: true
      }).then(stocks => 
        stocks.filter(s => {
          const total = parseInt(s.totalQuantity) || 0;
          const available = parseInt(s.totalAvailable) || 0;
          return total > 0 && (available / total) < 0.2;
        }).length
      ),
      
      // Expiring medicines (within 30 days)
      Medicine.count({
        where: {
          expirationDate: {
            [Op.between]: [new Date(), new Date(Date.now() + 30 * 86400000)]
          }
        }
      }),
      
      // Pending restock requests
      RestockRequest.count({ where: { status: 'PENDING' } }),
      
      // Calculate acceptance rate
      Distribution.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'Completed' THEN 1 ELSE 0 END")), 'completed']
        ],
        where: {
          date: { [Op.between]: [startDate, endDate] }
        },
        raw: true
      }).then(result => {
        const total = parseInt(result[0]?.total) || 0;
        const completed = parseInt(result[0]?.completed) || 0;
        return total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
      }),
      
      // Total quantity distributed
      Distribution.sum('quantity', {
        where: {
          date: { [Op.between]: [startDate, endDate] }
        }
      })
    ]);

    res.json({
      period: days === 'all' ? 'All Time' : `Last ${days} Days`,
      overview: {
        totalDistributions: totalDistributions || 0,
        totalMedicines: totalMedicines || 0,
        totalOfficers: totalOfficers || 0,
        totalStock: Math.round(totalStock) || 0,
        lowStockCount: lowStockCount || 0,
        expiringCount: expiringCount || 0,
        pendingRequests: pendingRequests || 0,
        acceptanceRate: parseFloat(acceptanceRate) || 0,
        totalQuantityDistributed: totalQuantityDistributed || 0
      }
    });
  } catch (error) {
    console.error("Error fetching overview:", error);
    res.status(500).json({ message: "Error fetching overview", error: error.message });
  }
};

// GET /api/reports/distribution-analytics - Detailed distribution analytics
export const getDistributionAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(days);

    // Daily distribution trend
    const dailyTrend = await Distribution.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('date')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'quantity']
      ],
      where: {
        date: { [Op.between]: [startDate, endDate] }
      },
      group: [sequelize.fn('DATE', sequelize.col('date'))],
      order: [[sequelize.fn('DATE', sequelize.col('date')), 'ASC']],
      raw: true
    });

    // Top distributed medicines
    const topMedicines = await Distribution.findAll({
      attributes: [
        'medicineId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'distributionCount']
      ],
      where: {
        date: { [Op.between]: [startDate, endDate] }
      },
      include: [{
        model: Medicine,
        as: 'medicine',
        attributes: ['id', 'name', 'dosage', 'category']
      }],
      group: ['medicineId', 'medicine.id'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 10,
      raw: false
    });

    // Officer performance
    const officerPerformance = await Distribution.findAll({
      attributes: [
        'officerId',
        [sequelize.fn('COUNT', sequelize.col('Distribution.id')), 'totalDistributions'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'Completed' THEN 1 ELSE 0 END")), 'completed']
      ],
      where: {
        date: { [Op.between]: [startDate, endDate] }
      },
      include: [{
        model: User,
        as: 'officer',
        attributes: ['id', 'username']
      }],
      group: ['officerId', 'officer.id'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      raw: false
    });

    // Status breakdown
    const statusBreakdown = await Distribution.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        date: { [Op.between]: [startDate, endDate] }
      },
      group: ['status'],
      raw: true
    });

    res.json({
      dailyTrend: dailyTrend.map(d => ({
        date: d.date,
        distributions: parseInt(d.count),
        quantity: parseInt(d.quantity)
      })),
      topMedicines: topMedicines.map(m => ({
        medicine: m.medicine.name,
        dosage: m.medicine.dosage,
        category: m.medicine.category,
        totalQuantity: parseInt(m.dataValues.totalQuantity),
        distributionCount: parseInt(m.dataValues.distributionCount)
      })),
      officerPerformance: officerPerformance.map(o => ({
        officer: o.officer.username,
        totalDistributions: parseInt(o.dataValues.totalDistributions),
        totalQuantity: parseInt(o.dataValues.totalQuantity),
        completed: parseInt(o.dataValues.completed),
        acceptanceRate: o.dataValues.totalDistributions > 0 
          ? ((o.dataValues.completed / o.dataValues.totalDistributions) * 100).toFixed(1)
          : 0
      })),
      statusBreakdown: statusBreakdown.reduce((acc, s) => {
        acc[s.status] = parseInt(s.count);
        return acc;
      }, {})
    });
  } catch (error) {
    console.error("Error fetching distribution analytics:", error);
    res.status(500).json({ message: "Error fetching distribution analytics", error: error.message });
  }
};

// GET /api/reports/stock-analytics - Stock health and predictions
export const getStockAnalytics = async (req, res) => {
  try {
    // Get stock health status
    const stockData = await Stock.findAll({
      attributes: [
        'medicineId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('quantityAvailable')), 'totalAvailable']
      ],
      include: [{
        model: Medicine,
        as: 'medicine',
        attributes: ['id', 'name', 'dosage', 'expirationDate']
      }],
      group: ['medicineId', 'medicine.id'],
      raw: false
    });

    // Categorize stock health
    const stockHealth = {
      healthy: 0,
      low: 0,
      critical: 0,
      details: []
    };

    stockData.forEach(stock => {
      const total = parseInt(stock.dataValues.totalQuantity) || 0;
      const available = parseInt(stock.dataValues.totalAvailable) || 0;
      const percentage = total > 0 ? (available / total) * 100 : 0;

      let status = 'healthy';
      if (percentage < 10) {
        status = 'critical';
        stockHealth.critical++;
      } else if (percentage < 25) {
        status = 'low';
        stockHealth.low++;
      } else {
        stockHealth.healthy++;
      }

      stockHealth.details.push({
        medicine: stock.medicine.name,
        dosage: stock.medicine.dosage,
        total,
        available,
        percentage: percentage.toFixed(1),
        status
      });
    });

    // Get expiring medicines
    const now = new Date();
    const thirtyDaysLater = new Date(Date.now() + 30 * 86400000);

    const expiringMedicines = await Medicine.findAll({
      where: {
        expirationDate: {
          [Op.between]: [now, thirtyDaysLater]
        }
      },
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(quantityAvailable), 0)
              FROM Stocks
              WHERE Stocks.medicineId = Medicine.id
            )`),
            'stock'
          ]
        ]
      },
      order: [['expirationDate', 'ASC']]
    });

    res.json({
      stockHealth,
      expiringMedicines: expiringMedicines.map(m => ({
        name: m.name,
        dosage: m.dosage,
        expirationDate: m.expirationDate,
        stock: parseInt(m.dataValues.stock) || 0,
        daysUntilExpiry: Math.ceil((new Date(m.expirationDate) - now) / 86400000)
      }))
    });
  } catch (error) {
    console.error("Error fetching stock analytics:", error);
    res.status(500).json({ message: "Error fetching stock analytics", error: error.message });
  }
};

// GET /api/reports/usage-analytics - Usage trends and predictions
export const getUsageAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(days);

    // Daily usage trend
    const dailyUsage = await DailyUsage.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('usageDate')), 'date'],
        [sequelize.fn('SUM', sequelize.col('quantityUsed')), 'totalUsed']
      ],
      where: {
        usageDate: { [Op.between]: [startDate, endDate] }
      },
      group: [sequelize.fn('DATE', sequelize.col('usageDate'))],
      order: [[sequelize.fn('DATE', sequelize.col('usageDate')), 'ASC']],
      raw: true
    });

    // Usage by medicine type
    const usageByMedicine = await DailyUsage.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('quantityUsed')), 'totalUsed']
      ],
      include: [{
        model: OfficerInventory,
        as: 'inventory',
        attributes: [],
        include: [{
          model: Medicine,
          as: 'medicine',
          attributes: ['id', 'name', 'dosage', 'category']
        }]
      }],
      where: {
        usageDate: { [Op.between]: [startDate, endDate] }
      },
      group: ['inventory.medicine.id'],
      order: [[sequelize.fn('SUM', sequelize.col('quantityUsed')), 'DESC']],
      limit: 10,
      raw: false
    });

    res.json({
      dailyUsage: dailyUsage.map(d => ({
        date: d.date,
        quantity: parseInt(d.totalUsed)
      })),
      usageByMedicine: usageByMedicine.map(u => ({
        medicine: u.inventory.medicine.name,
        dosage: u.inventory.medicine.dosage,
        category: u.inventory.medicine.category,
        totalUsed: parseInt(u.dataValues.totalUsed)
      }))
    });
  } catch (error) {
    console.error("Error fetching usage analytics:", error);
    res.status(500).json({ message: "Error fetching usage analytics", error: error.message });
  }
};

// GET /api/reports/restock-analytics - Restock request analytics
export const getRestockAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(days);

    // Status breakdown
    const statusBreakdown = await RestockRequest.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        requestDate: { [Op.between]: [startDate, endDate] }
      },
      group: ['status'],
      raw: true
    });

    // Urgency breakdown
    const urgencyBreakdown = await RestockRequest.findAll({
      attributes: [
        'urgency',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        requestDate: { [Op.between]: [startDate, endDate] },
        status: 'PENDING'
      },
      group: ['urgency'],
      raw: true
    });

    // Average response time (for processed requests)
    const responseTime = await RestockRequest.findAll({
      attributes: [
        [sequelize.fn('AVG', 
          sequelize.literal('TIMESTAMPDIFF(HOUR, requestDate, reviewedAt)')
        ), 'avgHours']
      ],
      where: {
        requestDate: { [Op.between]: [startDate, endDate] },
        reviewedAt: { [Op.ne]: null }
      },
      raw: true
    });

    // Most requested medicines
    const topRequested = await RestockRequest.findAll({
      attributes: [
        'medicineId',
        [sequelize.fn('COUNT', sequelize.col('RestockRequest.id')), 'requestCount'],
        [sequelize.fn('SUM', sequelize.col('requestedQuantity')), 'totalRequested']
      ],
      where: {
        requestDate: { [Op.between]: [startDate, endDate] }
      },
      include: [{
        model: Medicine,
        as: 'medicine',
        attributes: ['id', 'name', 'dosage']
      }],
      group: ['medicineId', 'medicine.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('RestockRequest.id')), 'DESC']],
      limit: 10,
      raw: false
    });

    res.json({
      statusBreakdown: statusBreakdown.reduce((acc, s) => {
        acc[s.status] = parseInt(s.count);
        return acc;
      }, {}),
      urgencyBreakdown: urgencyBreakdown.reduce((acc, u) => {
        acc[u.urgency] = parseInt(u.count);
        return acc;
      }, {}),
      avgResponseTime: Math.round(parseFloat(responseTime[0]?.avgHours) || 0),
      topRequested: topRequested.map(r => ({
        medicine: r.medicine.name,
        dosage: r.medicine.dosage,
        requestCount: parseInt(r.dataValues.requestCount),
        totalRequested: parseInt(r.dataValues.totalRequested)
      }))
    });
  } catch (error) {
    console.error("Error fetching restock analytics:", error);
    res.status(500).json({ message: "Error fetching restock analytics", error: error.message });
  }
};

// GET /api/reports/predictions - Predictive analytics
export const getPredictions = async (req, res) => {
  try {
    // Get officer inventories with usage history
    const inventories = await OfficerInventory.findAll({
      include: [
        {
          model: Medicine,
          as: 'medicine',
          attributes: ['id', 'name', 'dosage']
        },
        {
          model: User,
          as: 'officer',
          attributes: ['id', 'username']
        }
      ]
    });

    const predictions = [];

    for (const inventory of inventories) {
      // Get last 7 days usage
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentUsage = await DailyUsage.findAll({
        where: {
          inventoryId: inventory.id,
          usageDate: { [Op.gte]: sevenDaysAgo }
        },
        order: [['usageDate', 'DESC']]
      });

      if (recentUsage.length > 0) {
        const totalUsed = recentUsage.reduce((sum, u) => sum + u.quantityUsed, 0);
        const avgDailyUsage = totalUsed / recentUsage.length;
        const daysUntilEmpty = avgDailyUsage > 0 
          ? Math.floor(inventory.currentQuantity / avgDailyUsage)
          : null;

        let severity = 'good';
        if (daysUntilEmpty !== null) {
          if (daysUntilEmpty <= 2) severity = 'critical';
          else if (daysUntilEmpty <= 5) severity = 'warning';
        }

        if (severity !== 'good') {
          predictions.push({
            officer: inventory.officer.username,
            medicine: inventory.medicine.name,
            dosage: inventory.medicine.dosage,
            currentQuantity: inventory.currentQuantity,
            avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
            daysUntilEmpty,
            severity,
            recommendation: daysUntilEmpty <= 2 
              ? 'Immediate restock required'
              : 'Plan restock within next few days'
          });
        }
      }
    }

    // Sort by severity
    predictions.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, good: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    res.json({ predictions });
  } catch (error) {
    console.error("Error generating predictions:", error);
    res.status(500).json({ message: "Error generating predictions", error: error.message });
  }
};

// GET /api/reports/export - Export complete report data
export const exportReport = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Gather all analytics data
    const [overview, distributions, stock, usage, restock] = await Promise.all([
      getOverview({ query: { days } }, { json: data => data }),
      getDistributionAnalytics({ query: { days } }, { json: data => data }),
      getStockAnalytics({ query: {} }, { json: data => data }),
      getUsageAnalytics({ query: { days } }, { json: data => data }),
      getRestockAnalytics({ query: { days } }, { json: data => data })
    ]);

    res.json({
      generatedAt: new Date(),
      period: days === 'all' ? 'All Time' : `Last ${days} Days`,
      overview,
      distributions,
      stock,
      usage,
      restock
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({ message: "Error exporting report", error: error.message });
  }
};