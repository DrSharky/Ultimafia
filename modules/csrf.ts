//import { Request, Response, NextFunction } from 'express';

//export default function (req: Request, res: Response, next: NextFunction): void {
//    if (
//        req.method !== "GET" &&
//        req.session?.user &&
//        req.session.user.id &&
//        req.get("x-csrf") !== req.session.user.csrf
//    ) {
//        res.sendStatus(403);
//        return;
//    }

//    return next();
//}