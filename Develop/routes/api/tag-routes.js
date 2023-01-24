const router = require("express").Router();
const { Tag, Product, ProductTag } = require("../../models");

// The `/api/tags` endpoint

router.get("/", async (req, res) => {
  // find all tags
  try {
    const tagUserData = await Tag.findAll({
      // be sure to include its associated Product data
      include: [{ model: Product, through: ProductTag, as: "tag_products" }],
    });
    res.status(200).json(tagUserData);
  } catch (err) {
    res.json(500).json(err);
  }
});

router.get("/:id", async (req, res) => {
  // find a single tag by its `id`
  try {
    const tagUserData = await Tag.findByPk(req.params.id, {
      // be sure to include its associated Product data
      include: [{ model: Product, through: ProductTag, as: "tag_products" }],
    });
    if (!tagUserData) {
      res.status(404).json({ message: "Id not found" });
      return;
    }
    res.status(200).json(tagUserData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.post("/", async (req, res) => {
  // create a new tag
  try {
    let newTag = await Tag.create(req.body);
    if (req.body.productIds.length) {
      const idArray = req.body.productIds.map((product_id) => {
        return {
          newTag_id: newTag.id,
          product_id,
        };
      });
      let tpIds = ProductTag.bulkCreate(idArray);
      res.status(200).json(tpIds);
    } else {
      res.status(200).json(newTag);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

router.put("/:id", async (req, res) => {
  // update a tag's name by its `id` value
  try {
    let updateTag = await Tag.update(req.body, {
      where: {
        id: req.params.id,
      },
    });

    let tagProducts = ProductTag.findAll({ where: { tag_id: req.params.id } });
    if (req.body.productIds) {
      const tagProductIds = tagProducts.map(({ product_id }) => product_id);
      const newTagProducts = req.body.productIds
        .filter((product_id) => !tagProductIds.includes(product_id))
        .map((product_id) => {
          return {
            tag_id: req.params.id,
            product_id,
          };
        });

      const tagProductsToRemove = tagProducts
        .filter(({ product_id }) => !req.body.productIds.includes(product_id))
        .map(({ id }) => id);
      let updatedTagProducts = Promise.all([
        ProductTag.destroy({ where: { id: tagProductsToRemove } }),
        ProductTag.bulkCreate(newTagProducts),
      ]);
      res.status(200).json(updatedTagProducts);
    } else {
      res.status(200).json(updateTag);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

router.delete("/:id", async (req, res) => {
  // delete on tag by its `id` value
  try {
    const tagUserData = await Tag.destroy({
      where: {
        id: req.params.id,
      },
    });
    if (!tagUserData) {
      res.status(404).json({ message: "Id not found" });
      return;
    }
    res.status(200).json(tagUserData);
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
