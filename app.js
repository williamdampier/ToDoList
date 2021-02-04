//jshint esversion:6
const express = require("express"); //adding express module
const bodyParser = require("body-parser"); //adding HTML Body Parser module
const _ = require('lodash');

const app = express(); //defining app to use express
const mongoose = require('mongoose');


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "First Item"
});

const item2 = new Item({
  name: "Second Item"
});

const item3 = new Item({
  name: "Third Item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]

}

const List = new mongoose.model("List", listSchema);



app.get("/", function(req,res)
{
  Item.find({}, function (err, foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {console.log(err);} else {console.log("Successfully added items to DB");}
      });
    }
    else {
      res.render("list", {listTitle:"Today", newListItems:foundItems});
    }
  });




});

app.post("/", function(req,res)
  {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name : itemName
    });

if (listName === "Today") {

    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
  });

app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
if (listName === "Today")
{
  Item.findByIdAndRemove(checkedItemId, function(err)
  {
    if (err) {
      console.log(err);
    } else
    {
      console.log("Item removed");
      res.redirect("/");
    }
  }
    );
} else {
  List.findOneAndUpdate(
    {name: listName},
    {$pull: {items: {_id:checkedItemId}}},
    function (err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }
    }
  );
}



});

app.get("/:customListName", function (req,res)
{
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName}, function(err, foundList)
  {
    if (!err){

      if (!foundList)
      {

        const list = new List(
          {
          name: customListName,
          items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);

      }
      else
      {
        res.render("list", {listTitle:foundList.name, newListItems:foundList.items});
      }
    }
  });

});

app.get("/about", function(req,res){
  res.render("about");
});

  app.listen(3000, function(){
    console.log("Server is running on port 3000");
  });
