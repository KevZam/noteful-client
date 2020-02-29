const path = require("path");
const express = require("express");
const FolderService = require("./folder-service");
const xss = require("xss");
const FolderRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = folder => ({
  id: xss(folder.id),
  name: xss(folder.name)
});

FolderRouter.route("/folders")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    FolderService.getAllFolders(knexInstance)
      .then(folders => {
        res.json(folders.map(serializeFolder));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { id, name } = req.body;
    const newFolder = { name };

    for (const [key, value] of Object.entries(newFolder)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }

    newFolder.name = name;
    newFolder.id = id;

    FolderService.insertFolder(req.app.get("db"), newFolder)
      .then(folder => {
        res.status(201).json(serializeFolder(folder));
      })
      .catch(next);
  });

// bookmarkRouter
//   .route("/bookmarks/:id")
//   .get((req, res) => {
//     const { id } = req.params;
//     const bookMark = bookmarks.find(bid => bid.id == id);
//     if (!bookMark) {
//       logger.error(`Bookmark with id ${id} not found.`);
//       return res.status(404).send("Bookmark Not Found");
//     }

//     res.json(bookMark);
//   })
//   .delete((req, res) => {
//     const { id } = req.params;
//     bookMarkIndex = bookmarks.findIndex(bm => bm.id == id);
//     if (bookMarkIndex === -1) {
//       logger.error(`Bookmark with id ${id} not found.`);
//       return res.status(404).send("Not Found");
//     }

//     bookmarks.splice(bookMarkIndex, 1);
//     logger.info(`Bookmark with id ${id} deleted.`);
//     res.status(204).end();
//   });

module.exports = FolderRouter;
