//jshint esversion:6

/* Adding modules required: express, mongoose(for MongoDB connection), body parser, lodash(for custom link list Capitalize function)*/

const express = require("express");
const bodyParser = require("body-parser");
const _ = require('lodash');
const mongoose = require('mongoose');

const app = express(); //defining app to use express



app.set('view engine', 'ejs'); //enable ejs to be used

app.use(bodyParser.urlencoded({extended: true})); //enable body-parser to be used
app.use(express.static('public')); //enable publuc folder via express to access css



mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }); //connect to DB
/*-------------------------------------------------------------------------------------*/

/* Default Items list Schema init*/
const itemsSchema = {
  name: String
}

/*default items model and list creation */
const Item = mongoose.model("Item", itemsSchema); //Schema

//Items
const item1 = new Item({
  name: "First Item"
});

const item2 = new Item({
  name: "Second Item"
});

const item3 = new Item({
  name: "Third Item"
});

const defaultItems = [item1, item2, item3]; //array of default items will be passed into List

/*-------------------------------------------------------------------------------------*/


// This List Schema and Model will be used to create custom lists
const listSchema = {
  name: String,
  items: [itemsSchema]

}

const List = new mongoose.model("List", listSchema);

/*-------------------------------------------------------------------------------------*/

/* Main app section */

app.get("/", function(req,res)
{
  // If no Lists exist -> create first list passing default items in
  Item.find({}, function (err, foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {console.log(err);} else {console.log("Successfully added items to DB");}
      });
    }
    else {
    //if existing list found or passed on from redirect(<List Name>) -> render page & show the list
      res.render("list", {listTitle:"Today", newListItems:foundItems});
    }
  });




});

// /Post method handles new items added to the list function
app.post("/", function(req,res)
  {
    const itemName = req.body.newItem; //Item name taken from the input
    const listName = req.body.list; //List name taken from Page <%= listTitle %>

    // create Item that will be added to the List
    const item = new Item({
      name : itemName
    });
//If List name <%= listTitle %> is default, which is called "Today", add created item to that list then save in DB
if (listName === "Today") {

    item.save();
    res.redirect("/");
  } else {
    //Otherwise, take List name from a title and add new item to that list
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName); //redirect to root -> for render function
    });
  }
  });

/* Checkbox will delete items from the list, handled by processing name="checkbox" value="<%=item._id% inside <checkbox> input*/
app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox; //ItemId this checkbox belongs to
  const listName = req.body.listName; //listName from which we delete the item - from <%= listTitle %>

if (listName === "Today") //check if we are working with default list
{
  Item.findByIdAndRemove(checkedItemId, function(err) //dig into default List and find item by id, taken from checkbox value="<%=item._id%>"
  {
    if (err) {
      console.log(err);
    } else
    {
      console.log("Item removed");
      res.redirect("/"); //after item is deleted redirect to main
    }
  }
    );
} else {
  //if List is not default
  List.findOneAndUpdate(   //mongoose specific function->  find Item and remove
    {name: listName}, //conditions for filter -> looking for List with <%= listTitle %> as a name
    {$pull: {items: {_id:checkedItemId}}}, //$pull updates(remove) item with specified id -> taken from checkbox value value="<%=item._id%>"
    function (err, foundList){
      if (!err) {
        res.redirect("/" + listName); //after item is removed redirect to updated list page
      }
    }
  );
}



});

/*Custom List page*/
app.get("/:customListName", function (req,res)
{
  const customListName = _.capitalize(req.params.customListName); //Get listname from custom link page name

  List.findOne({name:customListName}, function(err, foundList)  //Find Custom List, if not found create new list
  {
    if (!err){

      if (!foundList) //if Custom List does not exist already
      {
        //Create List, fill with default items
        const list = new List(
          {
          name: customListName,
          items: defaultItems
          });
          list.save(); //save list to DB
          res.redirect("/" + customListName); //redirect to custom list page

      }
      else
      {
        res.render("list", {listTitle:foundList.name, newListItems:foundList.items}); //if List does exist -> redirect to list page passing Listname a a Title and fill with Items from DB
      }
    }
  });

});
/*About Section was created as express route testing scenario*/
app.get("/about", function(req,res){
  res.render("about");
});

/*app runs on localhost:3000*/
  app.listen(3000, function(){
    console.log("Server is running on port 3000");
  });
