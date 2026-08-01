import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conversationsRouter from "./conversations";
import chatRouter from "./chat";
import reactionsRouter from "./reactions";
import imagesRouter from "./images";
import memoriesRouter from "./memories";
import insightsRouter from "./insights";
import filesRouter from "./files";
import browseRouter from "./browse";
import sharedRouter from "./shared";
import searchRouter from "./search";
import visionRouter from "./vision";

const router: IRouter = Router();

router.use(healthRouter);
router.use(conversationsRouter);
router.use(chatRouter);
router.use(reactionsRouter);
router.use(imagesRouter);
router.use(memoriesRouter);
router.use(insightsRouter);
router.use(filesRouter);
router.use(browseRouter);
router.use(sharedRouter);
router.use(searchRouter);
router.use(visionRouter);

export default router;
