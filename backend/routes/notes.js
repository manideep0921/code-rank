import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import { listNotes, addNote, deleteNote } from "../controllers/notesController.js";

const router = express.Router();

router.get("/me", requireAuth, listNotes);
router.post("/", requireAuth, addNote);
router.delete("/:noteId", requireAuth, deleteNote);

export default router;
