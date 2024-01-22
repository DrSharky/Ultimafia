const express = require("express");
const routeUtils = require("./utils");
const redis = require("../modules/redis");
const models = require("../db/models");
const constants = require("../data/constants");
const logger = require("../modules/logging")(".");
const router = express.Router();
const fetch = require("node-fetch");

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

const shopItems = [
  {
    name: "Name and Text Colors",
    desc: "Set the colors of your name and text in games and chat",
    key: "textColors",
    price: 20,
    limit: 1,
    onBuy: function () {},
  },
  {
    name: "Profile Customization",
    desc: "Change the panel color and banner image on your profile",
    key: "customProfile",
    price: 20,
    limit: 1,
    onBuy: function () {},
  },
  {
    name: "Name Change",
    desc: "Change your name once per purchase",
    key: "nameChange",
    price: 20,
    limit: null,
    onBuy: function () {},
  },
  {
    name: "3 Character Username",
    desc: "Set your name to one that is 3 characters long",
    key: "threeCharName",
    price: 100,
    limit: 1,
    propagateItemUpdates: {
      nameChange: 1,
    },
    onBuy: function () {},
  },
  {
    name: "2 Character Username",
    desc: "Set your name to one that is 2 characters long",
    key: "twoCharName",
    price: 400,
    limit: 1,
    propagateItemUpdates: {
      nameChange: 1,
    },
    onBuy: function () {},
  },
  {
    name: "1 Character Username",
    desc: "Set your name to one that is 1 character long",
    key: "oneCharName",
    price: 800,
    limit: 1,
    propagateItemUpdates: {
      nameChange: 1,
    },
    onBuy: function () {},
  },
  {
    name: "Custom Death Message",
    desc: "Set the system message that appears on death. Comes with 2 free death message changes.",
    key: "deathMessageEnabled",
    price: 50,
    limit: 1,
    propagateItemUpdates: {
      deathMessageChange: 2,
    },
    onBuy: function () {},
  },
  {
    name: "Death Message Change",
    desc: "Change your death message, requires enabling custom death messages.",
    key: "deathMessageChange",
    price: 10,
    disableOn: (user) => !user.itemsOwned.deathMessageEnabled,
    onBuy: function () {},
  },
  {
    name: "Anonymous Deck",
    desc: "Create name decks for anonymous games. More Add-ons to come.",
    key: "anonymousDeck",
    price: 70,
    limit: constants.maxOwnedAnonymousDecks,
    onBuy: function () {},
  },
];

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

router.get("/info", async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    var userId = await routeUtils.verifyLoggedIn(req);
    var user = await models.User.findOne({ id: userId });

    //let customDisable = item.disableOn && item.disableOn(user);

    /*
    let shopItemsParsed = shopItems.map((item) => {
      let limitReached =
        item.limit != null && user.itemsOwned[item.key] >= item.limit;
      item.disabled = item.disabled || limitReached || false;
      return item;
    });*/

    res.send({ shopItems: shopItems, balance: user.coins });
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
