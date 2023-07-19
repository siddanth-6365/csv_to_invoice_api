const express = require("express");
const app = express();
const mongoose = require("mongoose");
var multer = require("multer");
var path = require("path");
const Order = require("./models/Order");
var csv = require("csvtojson");
var bodyParser = require("body-parser");
const cors = require("cors");
const port = 3000;

var upload = multer({ dest: "uploads/" });

// Enable CORS
app.use(cors());

mongoose
  .connect(
    "mongodb+srv://siddantheedu:reddy6365@cluster0.xvuh54d.mongodb.net/",
    { useNewUrlParser: true }
  )
  .then(() => console.log("connected to db"))
  .catch((err) => console.log(err));


//fetch data from the request
app.use(bodyParser.urlencoded({ extended: false }));
//static folder
app.use(express.static(path.resolve(__dirname, "public")));

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.json("test api");
});


async function saveOrders(jsonData) {
  try {
    for (const jsonObj of jsonData) {
      const order = new Order({
        orderId: jsonObj["Order ID"],
        customer: jsonObj["Customer"],
        orderDate: new Date(jsonObj["Order Date"]),
        items: [
          {
            itemName: jsonObj["Item Name"],
            quantity: parseInt(jsonObj["Quantity"]),
            unitPrice: parseFloat(jsonObj["Unit Price"]),
          },
        ],
      });

      // Save the order to the database
      await order.save();
    }
    console.log("Orders saved successfully");
  } catch (error) {
    console.error("Error saving orders:", error);
  }
}

app.post("/upload", upload.single("file"), (req, res, next) => {
  csv()
    .fromFile(req.file.path)
    .then((jsonObj) => {
      console.log("json fetch");
      saveOrders(jsonObj);
      res.json({
        message: "data fetch",
      });
    })
    .catch((error) => {
      res.status(500).send({
        message: "failure",
        error,
      });
    });
});

app.get("/orders", async (req, res) => {
  try {
    const uniqueOrderIds = await Order.distinct("orderId");

    // Calculate total amounts for each order
    const orderTotals = [];

    for (const orderId of uniqueOrderIds) {
      // getting list of all the order by orderid
      const orders = await Order.find({ orderId }).exec();
      const orderDate = orders[0].orderDate;
      let customerName = orders[0].customer;
      // Order.find() in Mongoose returns a query object, not an array. To convert the query object to an array and use the reduce() function
      // console.log("orders of each id :", orders);

      // going to each order and calculating the total amount by id
      //acc parameter represents the accumulated value in the reduce function
      const totalAmount = orders.reduce((acc, order) => {
        return (
          acc +
          order.items.reduce((acc, item) => {
            return acc + item.quantity * item.unitPrice;
          }, 0)
        );
      }, 0);
      orderTotals.push({ orderId, totalAmount, orderDate, customerName });
    }

    res.json({
      data: orderTotals,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/deletedb", async (req, res) => {
  try {
    await Order.deleteMany({});
    console.log("Data cleared successfully");
  } catch (error) {
    console.error("Error clearing data:", error);
  }
});

app.get("/invoice/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log("id :", id);
    const orderId = id;
    const orders = await Order.find({ orderId }).exec();
    // console.log("orders: ", orders);
    const userData = [];
    const orderDate = orders[0].orderDate;
    const customerName = orders[0].customer;
    const totalAmount = orders.reduce((acc, order) => {
      return (
        acc +
        order.items.reduce((acc, item) => {
          return acc + item.quantity * item.unitPrice;
        }, 0)
      );
    }, 0);

    //We use the flatMap method instead of reduce to create a flat array of items from the orders array.
    const items = orders.flatMap((order) => order.items);
    userData.push({ orderDate, customerName, totalAmount });

    res.json({
      items: items,
      userData: userData,
    });
  } catch (err) {
    res.json({
      error: err,
      message: "error in /invoice/id route",
    });
  }
});



app.listen(port, () => console.log(`Example app listening on port ${port}!`));
