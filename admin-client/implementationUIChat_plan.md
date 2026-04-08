# Implementation Plan: Premium AI Chatbot UI

This plan outlines the design and implementation of a premium, real-time AI chatbot interface for the restaurant ordering tablet. The goal is to provide a "Smart Assistant" that feels alive, responsive, and visually stunning using glassmorphism and modern React patterns.

## User Review Required

> [!IMPORTANT]
> The chatbot will be integrated into the `CustomerOrderingPage.jsx`. It will appear as a Floating Action Button (FAB) at the bottom right. 
> Please review the visual style (Glassmorphism) and the interaction flow (Slide-in drawer).

## Proposed Changes

### 1. New Components

#### [NEW] [ChatbotDrawer.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/components/common/ChatbotDrawer.jsx)
- **Design**: `backdrop-blur-2xl bg-white/80` with a subtle white border.
- **Features**:
  - Scrollable message list with auto-scroll to bottom.
  - Message bubbles:
    - **User**: Solid blue, right-aligned.
    - **Bot**: Glassy white/gray, left-aligned with a bot avatar.
  - **Typing Indicator**: Animated three dots.
  - **Quick Replies**: Chips like "Recommend a spicy dish" or "Vegetarian options".
  - **Input Field**: Sleek input with a "Send" icon.

#### [NEW] [FloatingChatButton.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/components/common/FloatingChatButton.jsx)
- **Design**: Circular button with a bot icon and a subtle pulse animation (`animate-pulse-slow`).
- **Position**: Bottom right.

### 2. Integration

#### [MODIFY] [CustomerOrderingPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/CustomerOrderingPage.jsx)
- **State Management**:
  - `isChatOpen`: boolean
  - `messages`: `[{ role: 'user' | 'bot', content: string }]`
  - `isTyping`: boolean
- **Logic**:
  - `sendMessage(text)`: 
    - Adds user message to state.
    - Sets `isTyping = true`.
    - POST to `${BASE_URL}/chat` with `sessionToken` and `message`.
    - Adds bot response to state.
- **Layout**:
  - Render `FloatingChatButton` and `ChatbotDrawer` at the end of the return statement.

## Visual Design Reference

![Chatbot Mockup](file:///C:/Users/PC/.gemini/antigravity/brain/4ca5b70c-1573-4912-92ea-2e0f9e606d03/restaurant_chatbot_ui_mockup_1775491449731.png)

## Verification Plan

### Manual Verification
- [ ] Open the chatbot via the FAB.
- [ ] Send a greeting and verify the typing indicator appears.
- [ ] Verify the bot response is rendered correctly in a glassy bubble.
- [ ] Test "Quick Replies" functionality.
- [ ] Ensure the drawer is responsive on tablet dimensions.
- [ ] Check if the drawer overlaps or interferes with the "Add to Cart" or "Place Order" buttons.
