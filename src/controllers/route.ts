import { Request, Response, Router, NextFunction } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.render("index.ejs",{title:"Ruby"});
});

router.get("/chat/:name", (req: Request, res: Response) => {
  const name = req.params.name;
  res.render("chat.ejs",{title:name});
});

router.get("/error-test", (req: Request, res: Response, next: NextFunction) => {
      // sentry test
      next(new Error('sentry error test'))
});

export default router;
