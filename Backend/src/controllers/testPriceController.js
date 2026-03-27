import TestPrice from "../models/TestPrice.js";
import { logAudit } from "../services/auditLogService.js";

export const createTestPrice = async (req, res) => {
  try {
    const { testId, price, department } = req.body;

    const existing = await TestPrice.findOne({
      testId,
      department: department || undefined,
    });
    if (existing) {
      const previousPrice = existing.price;
      existing.price = price;
      existing.updatedBy = req.user.id;
      await existing.save();
      await logAudit({
        actor: { id: req.user.id, name: req.user.name, role: req.user.role },
        action: "test_price_updated",
        entityType: "TestPrice",
        entityId: existing._id,
        details: {
          testId,
          department: department || null,
          previousPrice,
          newPrice: price,
        },
      });
      return res.json({ success: true, data: existing });
    }

    const record = await TestPrice.create({
      testId,
      price,
      department: department || undefined,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });
    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "test_price_created",
      entityType: "TestPrice",
      entityId: record._id,
      details: {
        testId,
        department: department || null,
        price,
      },
    });
    return res.status(201).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateTestPrice = async (req, res) => {
  try {
    const existing = await TestPrice.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Test price not found." });
    }

    const price = await TestPrice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );
    await logAudit({
      actor: { id: req.user.id, name: req.user.name, role: req.user.role },
      action: "test_price_updated",
      entityType: "TestPrice",
      entityId: price._id,
      details: {
        testId: price.testId,
        department: price.department || null,
        previousPrice: existing.price,
        newPrice: price.price,
      },
    });
    return res.json({ success: true, data: price });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTestPrices = async (req, res) => {
  try {
    const { testId, department, testType } = req.query;
    const filter = {};
    if (testId) filter.testId = testId;
    if (department) filter.department = department;

    const query = TestPrice.find(filter).populate("testId", "name testType isActive");
    if (testType) {
      query.where("testId.testType").equals(testType);
    }

    const prices = await query.sort({ createdAt: -1 });
    return res.json({ success: true, data: prices });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
