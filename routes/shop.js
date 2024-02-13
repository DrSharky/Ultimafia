const express = require("express");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const models = require("../db/models");
const constants = require("../data/constants");
const logger = require("../modules/logging")(".");
const router = express.Router();
const fetch = require("node-fetch");
const crypto = require("crypto");

const PAYPAL_CLIENT_ID = process.env.PP_ID;
const PAYPAL_CLIENT_SECRET = process.env.PP_SECRET;
const ppBase = process.env.PP_BASE_URL;
const PP_PORT = 8888;

const EXCHANGE_RATE = 0.15; // USD
const MIN_BUYABLE = 5;

const generateAccessToken = async() => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
    ).toString("base64");
    const response = await fetch(`${ppBase}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};

const generateClientToken = async() => {
  const accessToken = await generateAccessToken();
  const url = `${ppBase}/v1/identity/generate-token`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en_US",
      "Content-Type": "application/json",
    },
  });

  return handleResponse(response);
}

const getOrderCart = async(url, accessToken) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    method: "GET",
  });

  return handleResponse(response);
}

const createOrderItem = async(req, res, item) => {
  console.log(
    "shopping cart information passed from the frontend createOrderItem() callback:",
    req,
  );
  const quantity = 1;

  const accessToken = await generateAccessToken();
  const url = `${ppBase}/v2/checkout/orders`;
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: item.price,
        },
      }
    ]
  }

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  const respon = await handleResponse(response);

  const getResp =  await getOrderCart(respon.jsonResponse.links[0], accessToken);

  return getResp;

  // return handleResponse(response);
}

const createOrder = async(cart) => {
  // use the cart information passed from the front-end to calculate the purchase unit details
  console.log(
    "shopping cart information passed from the frontend createOrder() callback:",
    cart,
  );

  if (cart.body.quantity < MIN_BUYABLE) {
    throw new Error("Quantity is below the minimum!");
  }

  const valueInUSD = Math.round(((cart.body.quantity * EXCHANGE_RATE) + Number.EPSILON) * 100) / 100;

  const accessToken = await generateAccessToken();
  const url = `${ppBase}/v2/checkout/orders`;
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: valueInUSD,
        },
      },
    ],
  };

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

const captureOrder = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${ppBase}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
  });

  return handleResponse(response);
};

async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

router.post("/token", async function(req, res) {
  try {
    const { jsonResponse, httpStatusCode } = await generateClientToken();
    res.status(httpStatusCode).json(jsonResponse);
  }
  catch (error) {
    console.error("Failed to generate a client token:", error);
    res.status(500).send({ error: "Failed to generate client token" });
  }
});

router.post("/orders", async function(req, res) {
  try {
    // use the cart information passed from the front-end to calculate the order amount detals
    const { jsonResponse, httpStatusCode } = await createOrder(req);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

router.post("/orderItem", async function(req, res) {
  try {
    var item = await models.ShopItem.findOne({key: req.body.key});
    item = item.toJSON();
    if(!(await verify(item.key, req.body.hash))) {
      res.status(500).json({ error: "Invalid item hash!" });
      res.send();
    }

    const { jsonResponse, httpStatusCode } = await createOrderItem(req, res, item);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
})

const createCart = async(req, cart, res) => {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    // var purchaseUnits = [];
    // for (var i = 0; i < req.purchase_units.length; i++) {
    //   purchaseUnits.push();
    // }

    if (userId) {
      var orderCart = new models.Cart({
        orderId: cart.id,
        userId: userId,
        createTime: cart.create_time,
        purchase_units: cart.purchase_units
      });
      await orderCart.save();
    }
  }
  catch (error) {
    res.send(500);
  }
}

// router.post("/createCart", async function(req, res) {
//   try {
//     var userId = await routeUtils.verifyLoggedIn(req);

//     // var purchaseUnits = [];
//     // for (var i = 0; i < req.purchase_units.length; i++) {
//     //   purchaseUnits.push();
//     // }

//     if (userId) {
//       var orderCart = new models.Cart({
//         orderId: req.body.orderId,
//         userId: userId,
//         createTime: req.body.createTime,
//         purchase_units: req.body.purchase_units
//       });
//       await orderCart.save();
//     }
//   }
//   catch (error) {
//     res.send(500);
//   }
// });

router.get("/getCart", async function(req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);

    if (userId) {
      var cart = await models.Cart.findOne({userId: userId})
      .select("orderId createTime purchase_units");

      cart = cart.toJSON();
      res.send(cart);
    }
  }
  catch (error) {

  }
})

router.post("/orders/:orderID/capture", async function(req, res){
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    const { orderID } = req.params;
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    res.status(httpStatusCode).json(jsonResponse);

    const transaction = jsonResponse?.purchase_units[0].payments.captures[0];

    if (transaction.status === "COMPLETED") {
      if (transaction.amount.currency_code === "USD") {
        const coinsBought = (Math.round((parseInt(transaction.amount.value) + Number.EPSILON) * 100) / 100) * 4;
        var user = await models.User.findOne({ id: userId }).select(
          "name id coins"
        );
        user = user.toJSON();

        await models.User.updateOne({ id: userId }, { $set: {coins: user.coins + coinsBought } })
        .exec();
      }
    }


  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
});

router.post("/orders/coins", async function(req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    const coinsBought = req.coinsBought;
    var user = await models.Users.findOne({id: userId}).select(
      "id coins name"
    );

    user = user.toJSON();

    await models.Users.updateOne({id: userId, $set: {coins}})
    .exec();

  }
  catch (error) {
    console.error("Failed to distribute coins.", error);
    res.status(500).json({ error: "Failed to give coins. Contact admin for help." });
  }
});

router.post("/donation", async function(req, res) {
  try {
    var userSession = await models.User.findOne({id: receivedUserId}).select(
      "id name"
    );
    userSession = userSession.toJSON();

    var session = await models.Session.findOne({"session.user.id": userSession.id}).select(
      "expires lastModified session"
    );
    session = session.toJSON();
    var userReq = {session: session};
    var userId = await routeUtils.verifyLoggedIn(userReq);
      if (req.currency === "USD") {
        const coinsBought = Math.round((req.amount + Number.EPSILON) * 100) / 100;
        var user = await models.User.findOne({ id: userId }).select(
          "coins itemsOwned"
        );

        user = user.toJSON();

        await models.User.updateOne(
          { id: userId },
          { $set: user.coins + coinsBought })
          .exec();
      }

      console.log("Bought coins!");
  }
  catch (err) {
    logger.error(e);
    res.status(500);
    res.send("Error buying coins. DM admin for help.");
  }
});

const hash = async(key, salt) => {
  return new Promise((resolve, reject) => {
    // const salt = crypto.randomBytes(8).toString("hex");

    crypto.scrypt(key, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
      }
      resolve(derivedKey.toString("hex"));
    });
  });
}

const verify = async(key, hash) => {
  var item = await models.ShopItem.findOne({key: key})
    .select("_id name key");
    item = item.toJSON();
  return new Promise((resolve, reject) => {

    // const [salt, key] = hash.split(":");
    crypto.scrypt(key, item._id.toString(), 64, (error, derivedKey) => {
      if (error) {
        reject(error);
      }
      resolve(hash === derivedKey.toString("hex"));
    });
  });
}

router.get("/info", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId });

    var items = await models.ShopItem.find({});

    let shopItems = [];
    let payItems = [];

    for(let i = 0; i < items.length; i++) {
      var item = items[i].toJSON();
      item.hash = await hash(item.key, item._id.toString());
      delete(item._id);
      if (item.type === "pay") {
        payItems.push(item);  
      }
      else {
        shopItems.push(item);
      }
    }

    /*
    let shopItemsParsed = shopItems.map((item) => {
      let limitReached =
        item.limit != null && user.itemsOwned[item.key] >= item.limit;
      item.disabled = item.disabled || limitReached || false;
      return item;
    });*/

    res.send({ shopItems: shopItems, balance: user.coins, payItems: payItems });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error loading shop data.");
  }
});

router.post("/spendCoins", async function (req, res) {
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var itemIndex = Number(req.body.item);
    var shopItems = await models.ShopItem.find({type: "shop"});
    if (itemIndex < 0 || itemIndex >= shopItems.length) {
      res.status(500);
      res.send("Invalid item purchased.");
      return;
    }
    var item = shopItems[itemIndex];

    var user = await models.User.findOne({ id: userId }).select(
      "coins itemsOwned"
    );

    if (user.coins < item.price) {
      res.status(500);
      res.send("You do not have enough coins to purchase this.");
      return;
    }

    if (item.limit != null && user.itemsOwned[item.key] >= item.limit) {
      res.status(500);
      res.send("You already own this.");
      return;
    }

    let userChanges = {
      [`itemsOwned.${item.key}`]: 1,
      coins: -1 * item.price,
    };

    for (let k in item.propagateItemUpdates) {
      let change = item.propagateItemUpdates[k];
      userChanges[`itemsOwned.${k}`] = change;
    }

    await models.User.updateOne(
      { id: userId },
      {
        $inc: userChanges,
      }
    ).exec();

    await redis.cacheUserInfo(userId, true);
    res.sendStatus(200);
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send("Error spending coins.");
  }
});

module.exports = router;
