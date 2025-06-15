const Placement = require("../model/Placement");
const User = require("../model/User");
const { Parser } = require("json2csv");
const moment = require("moment"); // ✅ install if not yet

exports.createPlacementRecord = async (req, res) => {
  try {
    const {
      studentId,
      name,
      email,
      department,
      batchYear,
      company,
      role,
      package,
      type,
      driveDate,
      location,
    } = req.body;
    const student = await User.findOne({ studentId, role: "student" });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (
      student.name !== name ||
      student.email !== email ||
      student.department !== department ||
      student.year !== batchYear
    ) {
      return res.status(400).json({
        message:
          "Student data mismatch. Please verify email, department, and year",
      });
    }
    const newRecord = await Placement.create({
      studentId,
      name,
      email,
      department,
      batchYear,
      company,
      role,
      package,
      type,
      driveDate,
      location,
      createdBy: req.user._id,
      createdByRole: req.user.role,
    });

    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({
      message: "Failed to create placement record",
      error: err.message,
    });
  }
};

exports.getAllPlacementRecords = async (req, res) => {
  try {
    const { department, batchYear, company } = req.query;

    const filter = {};

    if (department) filter.department = department;
    if (batchYear) filter.batchYear = Number(batchYear);
    if (company) filter.company = company;

    const records = await Placement.find(filter).sort({ driveDate: -1 });

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch placement records",
      error: err.message,
    });
  }
};

exports.getStudentPlacementRecords = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied: Students only" });
    }

    const records = await Placement.find({
      studentId: req.user.studentId,
      email: req.user.email,
    }).sort({ driveDate: -1 });

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch student placements",
      error: err.message,
    });
  }
};

exports.getPlacementSummary = async (req, res) => {
  try {
    const records = await Placement.find();

    const bestOffers = new Map(); // studentId → best package
    const companies = new Set();

    for (const r of records) {
      companies.add(r.company);

      if (!bestOffers.has(r.studentId)) {
        bestOffers.set(r.studentId, r.package);
      } else {
        const currentBest = bestOffers.get(r.studentId);
        if (r.package > currentBest) {
          bestOffers.set(r.studentId, r.package);
        }
      }
    }

    const totalStudentsPlaced = bestOffers.size;
    const totalBestPackages = Array.from(bestOffers.values()).reduce(
      (sum, pkg) => sum + pkg,
      0
    );
    const averagePackage =
      totalStudentsPlaced > 0
        ? (totalBestPackages / totalStudentsPlaced).toFixed(2)
        : 0;

    res.status(200).json({
      totalPlacements: totalStudentsPlaced,
      averagePackage: Number(averagePackage),
      companiesVisited: companies.size,
      companies: Array.from(companies),
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to generate placement summary",
      error: err.message,
    });
  }
};

exports.deletePlacementRecord = async (req, res) => {
  try {
    const record = await Placement.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Placement record not found" });
    }

    await Placement.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Placement record deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete record", error: err.message });
  }
};

exports.updatePlacementRecord = async (req, res) => {
  try {
    const record = await Placement.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Placement record not found" });
    }

    const allowedFields = [
      "company",
      "role",
      "package",
      "type",
      "driveDate",
      "location",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        record[field] = req.body[field];
      }
    });

    await record.save();
    res.status(200).json({ message: "Placement record updated", record });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update record", error: err.message });
  }
};

exports.exportPlacementCSV = async (req, res) => {
  try {
    const records = await Placement.find().lean();

    if (records.length === 0) {
      return res
        .status(404)
        .json({ message: "No placement records to export" });
    }

    // ✅ Format driveDate
    const formatted = records.map((r) => ({
      ...r,
      driveDate: r.driveDate ? moment(r.driveDate).format("DD-MM-YYYY") : "",
    }));

    const fields = [
      "studentId",
      "name",
      "email",
      "department",
      "batchYear",
      "company",
      "role",
      "package",
      "type",
      "location",
      "driveDate",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("placement-records.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: "CSV export failed", error: err.message });
  }
};
