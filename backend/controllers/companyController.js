import Company from '../models/Company.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
export const getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find().sort('-createdAt');
    res.status(200).json({ success: true, count: companies.length, data: companies });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject a company
// @route   PATCH /api/companies/:id/approve
// @access  Private (Dean)
export const approveCompany = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    company.approvalStatus = status;
    company.departmentApprover = req.user.id;
    if (status === 'APPROVED') company.isActive = true;
    
    await company.save();

    await AuditLog.create({
      user: req.user.id,
      action: status === 'APPROVED' ? 'company_approved' : 'company_rejected',
      details: `${status} company: ${company.name}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a company
// @route   POST /api/companies
// @access  Private (Dean)
export const createCompany = async (req, res, next) => {
  try {
    const company = await Company.create({
      ...req.body,
      addedBy: req.user.id,
      approvalStatus: 'APPROVED' // Deans adding companies are automatically approved
    });

    await AuditLog.create({
      user: req.user.id,
      action: 'company_created',
      details: `Created company: ${company.name}`,
      ip: req.ip
    });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a company
// @route   PUT /api/companies/:id
// @access  Private (Dean)
export const updateCompany = async (req, res, next) => {
  try {
    let company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await AuditLog.create({
      user: req.user.id,
      action: 'company_updated',
      details: `Updated company: ${company.name}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle company status (Activate/Deactivate)
// @route   PATCH /api/companies/:id/status
// @access  Private (Dean)
export const toggleCompanyStatus = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    company.isActive = !company.isActive;
    await company.save();

    await AuditLog.create({
      user: req.user.id,
      action: company.isActive ? 'company_activated' : 'company_deactivated',
      details: `${company.isActive ? 'Activated' : 'Deactivated'} company: ${company.name}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a company
// @route   DELETE /api/companies/:id
// @access  Private (Dean)
export const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    await company.deleteOne();

    await AuditLog.create({
      user: req.user.id,
      action: 'company_deleted',
      details: `Deleted company: ${company.name}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, message: 'Company removed' });
  } catch (error) {
    next(error);
  }
};
