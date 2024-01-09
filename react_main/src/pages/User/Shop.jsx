import React, { useState, useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import LoadingPage from "../Loading";
import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

import "../../css/shop.css";

export function Message({ content }) {
  return <p>{content}</p>;
}

export default function Shop(props) {
  const [shopInfo, setShopInfo] = useState({ shopItems: [], balance: 0 });
  const [loaded, setLoaded] = useState(false);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  const [message, setMessage] = useState("");

  const initialOptions = {
    "client-id": "test",
    "enable-funding": "venmo,card",
    "disable-funding": "paylater",
    "data-sdk-integration-source": "integrationbuilder_sc",
  };

  useEffect(() => {
    document.title = "Shop | UltiMafia";
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
      quantity: "YOUR_PRODUCT_QUANTITY",
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

  return (
    <div className="span-panel main shop">
      <div className="top-bar">
        <div className="balance">
          <i className="fas fa-coins" />
          {shopInfo.balance}
          <div></div>Buy coins!
          <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{
            shape: "rect",
            layout: "vertical",
          }}
          createOrder={buyCoins}
          onApprove={approve}
        />
      </PayPalScriptProvider>
      <Message content={message} />
        </div>
      </div>
      <div className="shop-items">{shopItems}</div>
    </div>
  );
}
