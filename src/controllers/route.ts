import { Request, Response, Router } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.render("index.ejs",{title:"Hi Ruby!"});
});

router.get("/chat/:name", (req: Request, res: Response) => {
  const name = req.params.name;
  res.render("chat.ejs",{title:`Hi ${name}`});
});

export default router;
