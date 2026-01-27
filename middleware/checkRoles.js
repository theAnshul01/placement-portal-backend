// * higher-order middlware function: express expects middleware however we also want to pass arguments

const checkRole = (...allowedRoles) => {
    return (req, res, next) => {

        if(!req.user?.role){
            return res.status(401).json({
                message: "User role not found | Unauthorized"
            })
        }

        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json({
                message: "You do not have permission to perform this action"
            })
        }

        next()
    }
}

export default checkRole