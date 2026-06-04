const UserRoutes = require('./UserRoutes')
const ProductRoutes = require('./ProductRoutes')
const CourseRoutes = require('./CourseRoutes')
const PlanRoutes = require('./PlanRoutes')
const PaymentRoutes = require('./PaymentRoutes')
const ExamRoutes = require('./ExamRoutes')
const DocumentRoutes = require('./DocumentRoutes')

const routes= (app)=>{
    app.use('/api/user',UserRoutes)
    app.use('/api/product',ProductRoutes)
    app.use('/api/course', CourseRoutes )
    app.use('/api/plan', PlanRoutes)
    app.use('/api/payment', PaymentRoutes)
    app.use('/api/exam', ExamRoutes)
    app.use('/api/document', DocumentRoutes)
}

module.exports= routes