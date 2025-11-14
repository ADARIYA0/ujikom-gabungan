const { body } = require('express-validator');

exports.registerValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email Format is not valid'),
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only be letters, numbers and underscores'),
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[\W_]/).withMessage('Password must contain at least one special character')
];

exports.loginValidator = [
    body('identifier')
        .trim()
        .notEmpty().withMessage('Username or email is required'),
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
];