const express = require("express");
const NoteService = require("./notes-service");
const xss = require("xss");
const NoteRouter = express.Router();
const jsonParser = express.json();

const serializeNote = note => ({
  id: note.id,
  name: xss(note.name),
  folder: xss(note.folder),
  content: xss(note.content),
  date_modified: note.date_modified
});

NoteRouter.route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    NoteService.getAllNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(serializeNote));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { id, name, content, folder, date_modified } = req.body;
    const newNote = { name, content, folder, date_modified };

    for (const [key, value] of Object.entries(newNote)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }

    newNote.name = name;
    newNote.id = id;
    newNote.content = content;
    newNote.folder = folder;
    newNote.date_modified = date_modified;

    NoteService.insertNote(req.app.get("db"), newNote)
      .then(note => {
        res.status(201).json(serializeNote(note));
      })
      .catch(next);
  });

NoteRouter.route("/:id")
  .all((req, res, next) => {
    NoteService.getById(req.app.get("db"), req.params.id)
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note doesn't exist` }
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeNote(res.note));
  })
  .delete((req, res, next) => {
    NoteService.deleteNote(req.app.get("db"), req.params.id)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, content, folder, date_modified } = req.body;
    const NoteToUpdate = { name, content, folder, date_modified };

    const numberOfValues = Object.values(NoteToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'name' or  'id'`
        }
      });

    NoteService.updateNote(req.app.get("db"), req.params.id, NoteToUpdate)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = NoteRouter;
