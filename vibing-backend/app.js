const { corsOptions } = require('./src/config/corsOption');
const adminRoute = require('./src/routes/adminRoute');
const authRoute = require('./src/routes/authRoute');
const categoryRoute = require('./src/routes/categoryRoute');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const eventRoute = require('./src/routes/eventRoute');
const userRoute = require('./src/routes/userRoute');
const express = require('express');
const path = require('path');

const app = express();

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoute);
app.use('/api/auth/admin', adminRoute);
app.use('/api/category', categoryRoute);
app.use('/api/events', eventRoute);
app.use('/api/user', userRoute);
app.use('/api/payment', require('./src/routes/paymentRoute'));
app.use('/api/global-certificate-templates', require('./src/routes/certificateTemplates'));
app.use('/api/certificate', require('./src/routes/certificateRoute'));

app.get('/status', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is healthy',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;
