const express = require("express");
const FolderService = require("./folder-service");
const xss = require("xss");
const FolderRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = folder => ({
  id: xss(folder.id),
  name: xss(folder.name)
});

FolderRouter.route("/")
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

FolderRouter.route("/:id")
  .all((req, res, next) => {
    FolderService.getById(req.app.get("db"), req.params.id)
      .then(folder => {
        if (!folder) {
          return res.status(404).json({
            error: { message: `Folder doesn't exist` }
          });
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeFolder(res.folder));
  })
  .delete((req, res, next) => {
    FolderService.deleteFolder(req.app.get("db"), req.params.id)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, id } = req.body;
    const FolderToUpdate = { name };

    const numberOfValues = Object.values(FolderToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'name' or  'id'`
        }
      });

    FolderService.updateFolder(req.app.get("db"), req.params.id, FolderToUpdate)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = FolderRouter;
