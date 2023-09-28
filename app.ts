import express, { Request, Response, NextFunction, Application } from 'express';
import path from 'path';
import { config } from 'dotenv';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import compression from 'compression';

// Assuming these custom modules and routes also get TypeScript-ified.
import  logs from './modules/logging';
import session from './modules/session';
import csurf from 'csurf';

import indexRouter from './routes/index';
import authRouter from './routes/auth';
import gameRouter from './routes/game';
import setupRouter from './routes/setup';
import deckRouter from './routes/anonymousDeck';
import roleRouter from './routes/roles';
import userRouter from './routes/user';
import forumsRouter from './routes/forums';
import commentRouter from './routes/comment';
import modRouter from './routes/mod';
import chatRouter from './routes/chat';
import notifsRouter from './routes/notifs';
import shopRouter from './routes/shop';
import feedbackRouter from './routes/feedback';
import siteRouter from './routes/site';

config({ path: path.join(__dirname, '.env') });

const app: Application = express();


app.use(morgan('combined', {stream: logs.stream }));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session);
app.use(csurf({ cookie: true}));
app.use(
    compression({
        filter: (req: Request, res: Response) => {
            return req.headers['x-no-compression'] ? false : compression.filter(req, res);
        },
    })
);
app.use(
    '/uploads',
    express.static(path.join(__dirname, process.env.UPLOAD_PATH!), {
        maxAge: 3600,
    })
);
app.use(
    express.static(path.join(__dirname, 'react_main/build_public'), {
        maxAge: 3600,
    })
);

// Routes
app.use('/', indexRouter);
// ... [other routes]

app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'react_main/build_public/index.html'));
    res.cookie('XSRF-TOKEN', req.csrfToken());
    res.render('send', { csrfToken: req.csrfToken() });
});

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
    next(createError(404));
});

// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.status == 404) {
        res.status(404);
        res.send('404');
    } else {
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') == 'development' ? err : {};
        res.status(err.status || 500);
        res.send('Error');
    }
});

export default app;