import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 100, // limit each ip to 100 requests
    message: 'Too many requests from this IP, please try again after 15 minutes'
});