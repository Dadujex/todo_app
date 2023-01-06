const express = require("express");
const bodyParser = require("body-parser");
const date = require(`${__dirname}/date.js`);
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.set("view engine", "ejs");


mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://Dadu:VasmAcska2@cluster0.np3dcru.mongodb.net/todolistDB")

const itemSchema = {
    name: String
};
const listSchema = {
    name: String,
    items: [itemSchema]
};

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
    Item.find({}, (err, items) => {
        res.render("list", { listTitle: date.getDay(), newListItems: items, listTag: date.getDay() });
    });
});

app.get("/:listName", (req, res) => {
    let originalName = req.params.listName;
    let name = String(_.words([originalName], /[^,-/*+()=/%!+"';._ ]+/g).map(_.capitalize).join(' '));
    List.findOne({ name: name.split(" ").join("-") }, (err, foundList) => {
        if (err) {
            console.log(err);
        }
        else {
            if (!foundList) {
                const list = new List({
                    name: name.split(" ").join("-"),
                    items: []
                });
                list.save();
                res.redirect("/" + originalName);
            }
            else {
                res.render("list", { listTitle: name, newListItems: foundList.items, listTag: name.split(" ").join("-") });
            }
        }
    });
});

app.post("/", (req, res) => {
    let itemName = req.body.newItem;
    let listName = req.body.list;
    const item = new Item({ name: itemName });

    if (listName == date.getDay()) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + _.join(Array(listName), "-"));
        });
    }


});

app.post("/del", (req, res) => {
    const listName = req.body.listName;

    if (listName == date.getDay()) {
        Item.deleteOne({ _id: req.body.button }, (err) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Deleted an item");
            }
        });
        res.redirect("/");
    }
    else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: req.body.button } } }, (err, foundList) => {
            if (err) {
                console.log(err);
            }
            else {
                res.redirect("/" + listName);
            }
        });
    }

});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, () => {
    console.log("Runing on port " + port);
});