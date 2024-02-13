import React, { useState, useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import LoadingPage from "../Loading";
import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import NumberInput from "components/NumberInput";
import  { PaymentForm } from "components/PaymentForm";
import { FormControl, useFormControlContext } from "@mui/base/FormControl";
import { styled } from '@mui/system';

import "../../css/shop.css";

export function Message({ content }) {
  return <p>{content}</p>;
}

export default function Shop(props) {
  const [shopInfo, setShopInfo] = useState({ shopItems: [], payItems: [], balance: 0 });
  const [loaded, setLoaded] = useState(false);
  const [paying, setPaying] = useState(true);
  const [clientToken, setClientToken] = useState(null);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const [message, setMessage] = useState("");

  const [coinsToBuy, setCoins] = useState(20);

  const initialOptions = {
    "clientId": "AQZ3-LaClD9R0VIRZkXWnew_caujxLXFjW1QlexUvzW6wCOPrrZcY2P-CgLEOUXifZijwXMzNACTOxwY",
    "enable-funding": "card",
    "disable-funding": "paylater",
    "dataSdkIntegrationSource": "integrationbuilder_sc",
    "dataClientToken": clientToken,
    "dataNamespace": "PayPalSDK",
    "components": "hosted-fields,buttons"
  };

  useEffect(() => {
    document.title = "Shop | UltiMafia";

    axios
      .post("/shop/token")
      .then((res) => {
        const token = res.data;
        setClientToken(token.client_token);
      })
      .catch(errorAlert);
  }, []);

  useEffect(() => {
    if (!user.loaded || !user.loggedIn) return;

    axios
      .get("/shop/info")
      .then((res) => {
        setShopInfo(res.data);
        setLoaded(true);
      })
      .catch(errorAlert);

  }, [user.loaded]);

  const [order, setOrder] = useState(null);

  function onPayItem(index) {
    const item = shopInfo.payItems[index];
    // const shouldBuy = window.confirm(
    //   `Are you sure you wish to buy ${item.name} for ${item.price} dollars?`
    // );

    // if (!shouldBuy) return;

    if (order === null) {
      axios
      .post("/shop/orderItem", { key: item.key, hash: item.hash, quantity: 1 })
      .then((res) => {
        // setPaying(true);
        const orderTotal = res.data.purchase_units.reduce((acc, curr) => acc + parseFloat(curr.amount.value), 0);
        setOrder({id: res.data.id, total: orderTotal.toFixed(2)});
      })
    }
    else {

    }
  }

 

  function onBuyItem(index) {
    const item = shopInfo.shopItems[index];
    const shouldBuy = window.confirm(
      `Are you sure you wish to buy ${item.name} for ${item.price} coins?`
    );

    if (!shouldBuy) return;

    axios
      .post("/shop/spendCoins", { item: index })
      .then(() => {
        siteInfo.showAlert("Item purchased.", "success");

        setShopInfo(
          update(shopInfo, {
            balance: {
              $set: shopInfo.balance - item.price,
            },
          })
        );

        let itemsOwnedChanges = {
          [item.key]: {
            $set: user.itemsOwned[item.key] + 1,
          },
        };

        // propagate other item updates
        for (let k in item.propagateItemUpdates) {
          let change = item.propagateItemUpdates[k];
          itemsOwnedChanges[k] = {
            $set: user.itemsOwned[k] + change,
          };
        }

        user.set(
          update(user.state, {
            itemsOwned: itemsOwnedChanges,
          })
        );
      })
      .catch(errorAlert);
  }

  const buyCoins = async() => {
    return axios
    .post("/shop/orders",
    {
      id: "YOUR_PRODUCT_ID",
      quantity: coinsToBuy,
    },
    {headers:
      {
        "Content-Type": "application/json"
      }
    })
    .then((res) => {
      if (res.data.id) {
        return res.data.id;
      }
      else {
        const errorDetail = res?.data?.details?.[0];
        const errorMessage = errorDetail ?
        `${errorDetail.issue} ${errorDetail.description} (${res?.data?.debug_id})` :
        JSON.stringify(res?.data);
        throw new Error(errorMessage);
      }
    })
    .catch(errorAlert);
  }

  const approve = async(data, actions) => {
    return axios
    .post(`/shop/orders/${data.orderID}/capture`)
    .then((res) => {
      const errorDetail = res?.data?.details?.[0];

      if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
        return actions.restart();
      }
      else if (errorDetail) {
        throw new Error(`${errorDetail.description} (${res?.data?.debug_id})`);
      }
      else {
        const transaction = res?.data?.purchase_units[0].payments.captures[0];
        setMessage(`Transaction ${transaction.status}: ${transaction.id}. See console for all available details`);
        console.log("Capture result", res, JSON.stringify(res?.data, null, 2));
      }
    })
    .catch(errorAlert);
  }

  const payItems = shopInfo.payItems.map((item, i) => (
    <div className="shop-item" key={i}>
      <div className="name">{item.name}</div>
      <div className="desc">{item.desc}</div>
      <div className="bottom">
        <div className="price">
          <i className="fas fa-money-bill-wave" />
          {item.price} dollars
        </div>
        <div className="owned">
          Owned:
          <div className="amt">
            {!user.itemsOwned[item.key] && "0"}
            {user.itemsOwned[item.key] &&  user.itemsOwned[item.key]}
            {item.limit != null && ` / ${item.limit}`}
          </div>
        </div>
        <div
          className={`buy btn btn-theme`}
          disabled={item.disabled}
          onClick={() => onPayItem(i)}
        >
          Add to cart
        </div>
      </div>
    </div>
  ))

  const shopItems = shopInfo.shopItems.map((item, i) => (
    <div className="shop-item" key={i}>
      <div className="name">{item.name}</div>
      <div className="desc">{item.desc}</div>
      <div className="bottom">
        <div className="price">
          <i className="fas fa-coins" />
          {item.price} coins
        </div>
        <div className="owned">
          Owned:
          <div className="amt">
            {user.itemsOwned[item.key]}
            {item.limit != null && ` / ${item.limit}`}
          </div>
        </div>
        <div
          className={`buy btn btn-theme`}
          disabled={item.disabled}
          onClick={() => onBuyItem(i)}
        >
          Buy
        </div>
      </div>
    </div>
  ));

  if (user.loaded && !user.loggedIn) return <Redirect to="/play" />;

  if (!loaded) return <LoadingPage />;

  const setBuyCoins = (coins) => {
    setCoins(coins);
  }

  return (
    <div className="span-panel main shop">
      { !paying &&
       <><div className="top-bar">
          <div className="balance">
            <i className="fas fa-coins" />
            {shopInfo.balance}
            <div></div>
          </div>
          <div className="coin-header">
            <h1>Buy coins!</h1>
          </div>
          <div className="coin-body">
            <div className="coin-body-input">
              <h3>Coins to Buy</h3>
              <NumberInput
                value={coinsToBuy}
                defaultValue={20}
                onValueChange={setBuyCoins}
                minValue={5} maxValue={2000}>
              </NumberInput>
            </div>
            <div className="coin-body-display">
              <h3>Price in USD</h3>
              <div className="buy-value">
                <h2>${Math.round(((coinsToBuy * 0.15) + Number.EPSILON) * 100) / 100}</h2>
              </div>
            </div>
          </div>
          <div className="paypal-outer-container">
            <div className="paypal-container">
              {/* <PayPalScriptProvider options={initialOptions}>
                <PayPalButtons
                  style={{
                    shape: "rect",
                    layout: "vertical",
                  }}
                  createOrder={buyCoins}
                  onApprove={approve} />
              </PayPalScriptProvider> */}
            </div>
          </div>
        </div>
        <h2>Premium Items</h2>
        <div className="pay-items">{payItems}</div>
        <h2>Shop Items</h2>
        <div className="shop-items">{shopItems}</div></>
              }
              <>
              {clientToken && paying && 
              <div>
                <PayPalScriptProvider options={initialOptions}>
                  <PaymentForm/>
                </PayPalScriptProvider>
              </div>
                }
              </>
    </div>
  );
}