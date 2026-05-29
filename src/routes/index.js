const UserRoutes = require('./UserRoutes')
const ProductRoutes = require('./ProductRoutes')
const CourseRoutes = require('./CourseRoutes')
const PlanRoutes = require('./PlanRoutes')
const PaymentRoutes = require('./PaymentRoutes')

const routes= (app)=>{
    app.use('/api/user',UserRoutes)
    app.use('/api/product',ProductRoutes)
    app.use('/api/course', CourseRoutes )
    app.use('/api/plan', PlanRoutes)
    app.use('/api/payment', PaymentRoutes)
}

module.exports= routes