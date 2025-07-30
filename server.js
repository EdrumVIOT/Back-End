const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const swaggerDoc = require('./swagger-output.json');
const HttpError = require('./middleware/http-error');
const db = require('./config/db'); 
const userRoutes = require('./routes/user-routes');
const adminRoutes = require('./routes/admin-routes');
const studentRoutes = require('./routes/student-routes');
const teacherRoutes = require('./routes/teacher-routes');
const storeRoutes = require('./routes/store-routes');
const courseRoutes = require('./routes/course-routes');

dotenv.config({ path: './config/.env' });

const app = express();
const PORT = process.env.PORT;


db.connectToMongoDB?.(); 


app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(bodyParser.json());


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/student', studentRoutes);
app.use('/teacher', teacherRoutes);
app.use('/store', storeRoutes);
app.use('/course', courseRoutes);


app.use((req, res, next) => {
  next(new HttpError('Could not find this route.', 404));
});


app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(error.code || 500).json({ message: error.message || 'An unknown error occurred!' });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
