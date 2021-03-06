import * as cartAPI from "@/api/cart";

export default {
  namespaced: true,
  state: {
    cartProducts: {
      특별배송: [],
      새벽배송: [],
      택배: [],
    },
    checkedCartProducts: {
      특별배송: [],
      새벽배송: [],
      택배: [],
    },
    cartProductRequiresQuantityUpdateModal: false,
  },
  getters: {
    checkedCartProductsPrice(state, getters, rootState, rootGetters) {
      let checkedCartProductsPrice = 0;
      for (let productGroup of rootGetters["productGroup/productGroupNames"]) {
        for (let cartProduct of state.checkedCartProducts[productGroup]) {
          checkedCartProductsPrice +=
            cartProduct.product.price * cartProduct.quantity;
        }
      }
      return checkedCartProductsPrice;
    },
    everyCartProductsPrice(state, getters, rootState, rootGetters) {
      let everyCartProductsPrice = 0;
      for (let productGroup of rootGetters["productGroup/productGroupNames"]) {
        for (let cartProduct of state.cartProducts[productGroup]) {
          everyCartProductsPrice +=
            cartProduct.product.price * cartProduct.quantity;
        }
      }
      return everyCartProductsPrice;
    },
    checkedCartProductIds(state, getters, rootState, rootGetters) {
      let checkedCartProductIds = [];
      for (let productGroup of rootGetters["productGroup/productGroupNames"]) {
        for (let cartProduct of state.checkedCartProducts[productGroup]) {
          checkedCartProductIds.push(cartProduct.id);
        }
      }
      return checkedCartProductIds;
    },
    everyCartProductIds(state, getters, rootState, rootGetters) {
      let everyCartProductIds = [];
      for (let productGroup of rootGetters["productGroup/productGroupNames"]) {
        for (let cartProduct of state.cartProducts[productGroup]) {
          everyCartProductIds.push(cartProduct.id);
        }
      }
      return everyCartProductIds;
    },
  },
  mutations: {
    SET_CART_PRODUCTS(state, { productGroupNames, cartProducts }) {
      for (let productGroup of productGroupNames) {
        if (productGroup in cartProducts) {
          state.cartProducts[productGroup] = cartProducts[productGroup];
        } else {
          state.cartProducts[productGroup] = [];
        }
      }
    },
    UPDATE_CART_PRODUCT(state, addedCartProduct) {
      let group = addedCartProduct.product.productGroup.name;
      if (!(group in state.cartProducts)) {
        state.cartProducts[group] = [];
      }

      for (let cartProduct of state.cartProducts[group]) {
        if (cartProduct.product.id === addedCartProduct.product.id) {
          cartProduct.quantity = addedCartProduct.quantity;
          return;
        }
      }
      state.cartProducts[group].push(addedCartProduct);
    },
    REMOVE_CART_PRODUCT(state, { removedCartProductId, productGroupName }) {
      for (let i = 0; i < state.cartProducts[productGroupName].length; i++) {
        let cartProduct = state.cartProducts[productGroupName][i];
        if (cartProduct.id === removedCartProductId) {
          state.cartProducts[productGroupName].splice(i, 1);
          return;
        }
      }
    },
    REMOVE_CHECKED_CART_PRODUCT(
      state,
      { removedCartProductId, productGroupName }
    ) {
      for (
        let i = 0;
        i < state.checkedCartProducts[productGroupName].length;
        i++
      ) {
        let cartProduct = state.checkedCartProducts[productGroupName][i];
        if (cartProduct.id === removedCartProductId) {
          state.checkedCartProducts[productGroupName].splice(i, 1);
          return;
        }
      }
    },
    SET_CART_PRODUCT_REQUIRES_QUANTITY_UPDATE_MODAL(state, value) {
      state.cartProductRequiresQuantityUpdateModal = value;
    },
  },
  actions: {
    getCartProducts({ commit, rootGetters }) {
      cartAPI
        .getCartProducts(rootGetters["user/userEmail"])
        .then((response) => {
          commit("SET_CART_PRODUCTS", {
            productGroupNames: rootGetters["productGroup/productGroupNames"],
            cartProducts: response.data,
          });
        })
        .catch((err) => {
          if (err.response.status === 409) {
            commit("SET_CART_PRODUCT_REQUIRES_QUANTITY_UPDATE_MODAL", true);
          }
        });
    },
    addToCart({ commit, rootState }) {
      cartAPI
        .addToCart(
          rootState.product.checkingProduct.id,
          rootState.product.checkingProduct.quantity
        )
        .then((response) => {
          if (response.status === 201) {
            commit("UPDATE_CART_PRODUCT", response.data);
            commit("alert/SHOW_CART_ADD_SUCCESS_ALERT", 3, { root: true });
            commit(
              "product/SET_CHECKING_PRODUCT",
              { id: null, quantity: null },
              { root: true }
            );
          } else {
            console.log(response);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    },
    updateCartProduct({ commit }, { cartProductId, quantity }) {
      cartAPI
        .updateCartProduct(cartProductId, quantity)
        .then((response) => {
          commit("UPDATE_CART_PRODUCT", response.data);
        })
        .catch((err) => {
          console.error(err);
        });
    },
    removeCartProduct({ commit }, cartProduct) {
      cartAPI
        .deleteCartProduct(cartProduct.id)
        .then((response) => {
          let productGroupName = cartProduct.product.productGroup.name;
          commit("REMOVE_CART_PRODUCT", {
            removedCartProductId: response.data,
            productGroupName,
          });
          commit("REMOVE_CHECKED_CART_PRODUCT", {
            removedCartProductId: response.data,
            productGroupName,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    },
  },
};
