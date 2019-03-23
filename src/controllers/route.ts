import { Request, Response, Router } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.render("index.ejs",{title:"Ruby"});
});

router.get("/chat/:name", (req: Request, res: Response) => {
  const name = req.params.name;
  res.render("chat.ejs",{title:name});
});

export default router;
