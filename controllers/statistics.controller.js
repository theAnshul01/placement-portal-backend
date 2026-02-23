import Student from '../models/Student.js'
import Recruiter from '../models/Recruiter.js'
import Job from '../models/Job.js'
import Application from '../models/Application.js'

/*
* @desc Get global placement statistics
* @route GET /api/officer/statistics/overview
* @access ADMIN, OFFICER
*/

export const getPlacementOverview = async (req, res, next) => {
    try {

        // student stats
        const totalStudents = await Student.countDocuments()
        const placedStudents = await Student.countDocuments({ isPlaced: true })
        const unplacedStudents = totalStudents - placedStudents

        // Avoid divide by zero
        const placementPercentage = (totalStudents === 0)
            ? 0
            : ((placedStudents / totalStudents) * 100).toFixed(2)

        // recruiter stats
        const totalRecruiters = await Recruiter.countDocuments()
        const verifiedRecruiters = await Recruiter.countDocuments({ isVerified: true })

        // job stats
        const totalJobs = await Job.countDocuments()
        const openJobs = await Job.countDocuments({ status: "OPEN" })
        const closedJobs = totalJobs - openJobs

        // application stats (aggregation)
        const applicationStats = await Application.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ])

        // converting aggregation result into key-value object
        const applicationSummary = {
            totalApplications: 0,
            APPLIED: 0,
            SHORTLISTED: 0,
            SELECTED: 0,
            REJECTED: 0,
            WITHDRAWN: 0
        }

        applicationStats.forEach(stat => {
            applicationSummary[stat._id] = stat.count
            applicationSummary.totalApplications += stat.count
        })

        res.status(200).json({
            students: {
                total: totalStudents,
                placed: placedStudents,
                unplaced: unplacedStudents,
                placementPercentage
            },
            recruiters: {
                total: totalRecruiters,
                verified: verifiedRecruiters
            },
            jobs: {
                total: totalJobs,
                open: openJobs,
                closed: closedJobs
            },
            applications: applicationSummary
        })

    } catch (error) {
        next(error)
    }
}

/*
* @desc Get global branch wise placement statistics
* @route GET /api/officer/statistics/branchwise
* @access ADMIN, OFFICER
*/
export const getBranchWisePlacements = async (req, res, next) => {
    try {

        const result = await Student.aggregate([

            {
                $facet: {

                    // ==============================
                    // 1️⃣ Branch Wise Stats
                    // ==============================
                    branchWiseStats: [

                        {
                            $group: {
                                _id: "$branch",
                                totalStudents: { $sum: 1 },
                                placedStudents: {
                                    $sum: {
                                        $cond: [{ $eq: ["$isPlaced", true] }, 1, 0]
                                    }
                                }
                            }
                        },

                        {
                            $addFields: {
                                unplacedStudents: {
                                    $subtract: ["$totalStudents", "$placedStudents"]
                                },
                                placementPercentage: {
                                    $cond: [
                                        { $eq: ["$totalStudents", 0] },
                                        0,
                                        {
                                            $multiply: [
                                                { $divide: ["$placedStudents", "$totalStudents"] },
                                                100
                                            ]
                                        }
                                    ]
                                }
                            }
                        },

                        {
                            $project: {
                                _id: 0,
                                branch: "$_id",
                                totalStudents: 1,
                                placedStudents: 1,
                                unplacedStudents: 1,
                                placementPercentage: {
                                    $round: ["$placementPercentage", 2]
                                }
                            }
                        },

                        { $sort: { placementPercentage: -1 } }

                    ],

                    // ==============================
                    // 2️⃣ Overall Summary
                    // ==============================
                    overallStats: [

                        {
                            $group: {
                                _id: null,
                                totalStudents: { $sum: 1 },
                                totalPlaced: {
                                    $sum: {
                                        $cond: [{ $eq: ["$isPlaced", true] }, 1, 0]
                                    }
                                }
                            }
                        },

                        {
                            $addFields: {
                                overallPlacementPercentage: {
                                    $cond: [
                                        { $eq: ["$totalStudents", 0] },
                                        0,
                                        {
                                            $multiply: [
                                                { $divide: ["$totalPlaced", "$totalStudents"] },
                                                100
                                            ]
                                        }
                                    ]
                                }
                            }
                        },

                        {
                            $project: {
                                _id: 0,
                                totalStudents: 1,
                                totalPlaced: 1,
                                overallPlacementPercentage: {
                                    $round: ["$overallPlacementPercentage", 2]
                                }
                            }
                        }
                    ]

                }
            }
        ])

        const branchWiseStats = result[0].branchWiseStats
        const overallStats = result[0].overallStats[0] || {
            totalStudents: 0,
            totalPlaced: 0,
            overallPlacementPercentage: 0
        }

        res.status(200).json({
            totalBranches: branchWiseStats.length,
            totalStudents: overallStats.totalStudents,
            totalPlaced: overallStats.totalPlaced,
            overallPlacementPercentage: overallStats.overallPlacementPercentage,
            branches: branchWiseStats
        })

    } catch (error) {
        next(error)
    }
}

/*
* @desc Get global job wise application funneling statistics
* @route GET /api/officer/statistics/job-funnel
* @access ADMIN, OFFICER //? NOTE - can be extended to recruiter for the recruiter specific job Ids
*/
export const getJobWiseFunnel = async (req, res, next) => {
    try {
        const jobWiseFunnel = await Application.aggregate([
            {
                $group: {
                    _id: {
                        jobId: "$jobId",
                        status: "$status"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.jobId",
                    stages: {
                        $push: {
                            status: "$_id.status",
                            count: "$count"
                        }
                    },
                    totalApplications: { $sum: "$count" }
                }
            },
            {
                $addFields: {
                    stages: {
                        $arrayToObject: {
                            $map: {
                                input: "$stages",
                                as: "stage",
                                in: {
                                    k: "$$stage.status",
                                    v: "$$stage.count"
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    stages: {
                        $mergeObjects: [
                            {
                                APPLIED: 0,
                                SHORTLISTED: 0,
                                REJECTED: 0,
                                SELECTED: 0,
                                WITHDRAWN: 0
                            },
                            "$stages"
                        ]
                    }
                }
            },
            {
                $addFields: {
                    appliedToShortlistedRate: {
                        $cond: [
                            { $eq: ["$stages.APPLIED", 0] },
                            0,
                            {
                                $multiply: [
                                    { $divide: ["$stages.SHORTLISTED", "$stages.APPLIED"] },
                                    100
                                ]
                            }
                        ]
                    },
                    shortlistedToSelectedRate: {
                        $cond: [
                            { $eq: ["$stages.SHORTLISTED", 0] },
                            0,
                            {
                                $multiply: [
                                    { $divide: ["$stages.SELECTED", "$stages.SHORTLISTED"] },
                                    100
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    jobId: "$_id",
                    totalApplications: 1,
                    stages: 1,
                    appliedToShortlistedRate: { $round: ["$appliedToShortlistedRate", 2] },
                    shortlistedToSelectedRate: { $round: ["$shortlistedToSelectedRate", 2] }
                }
            }
        ])

        res.status(200).json({
            totalJobs: jobWiseFunnel.length,
            jobs: jobWiseFunnel
        })

    } catch (error) {
        next(error)
    }
}
