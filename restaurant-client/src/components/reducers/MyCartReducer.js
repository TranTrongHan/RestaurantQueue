const MyCartReducer = (state, action) => {
    switch (action.type) {
        case "add": {
            const existing = state.find(i => i.menuItemId === action.payload.menuItemId);
            if (existing) {

                return state.map(i =>
                    i.menuItemId === action.payload.menuItemId
                        ? { ...i, quantity: i.quantity + action.payload.quantity }
                        : i
                );
            } else {

                return [...state, { ...action.payload }];
            }
        }
        case "remove":
            return state.filter(i => i.menuItemId !== action.payload.menuItemId);

        case "clear":
            return [];


        case "updateId": {
            return state.map(i =>
                i.menuItemId === action.payload.menuItemId
                    ? { ...i, cartItemId: action.payload.cartItemId }
                    : i
            );
        }
        default:
            return state;
    }

};

export default MyCartReducer;
