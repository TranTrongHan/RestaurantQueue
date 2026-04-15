# Implementation Plan: Frontend Chatbot UI - Customer Tablet

## Goal
Add a premium, real-time-like chatbot interface to the `CustomerOrderingPage.jsx` to assist customers with dish recommendations and general inquiries.

## Design Strategy
- **Rich Aesthetics**: Use glassmorphism, smooth CSS transitions, and Lucide icons.
- **Floating Action Button (FAB)**: A "Smart Assistant" button at the bottom right.
- **Context-Aware**: Send the `sessionToken` with every chat request so the backend knows the table and preferences.

## Proposed Changes

### [MODIFY] [CustomerOrderingPage.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/pages/CustomerOrderingPage.jsx)
- **State Management**:
  - `showChat`: boolean
  - `chatMessages`: array of objects `{ role: 'user' | 'bot', content: string }`
  - `isTyping`: boolean
- **UI Components**:
  - `ChatbotDrawer`: A slide-in or pop-up interface from the bottom/right.
  - `FloatingChatButton`: A circular button with a bot icon and pulse animation.
- **API Logic**:
  - `handleSendMessage`: Sends user input to `POST /api/chat`, handles the response, and updates the history.
  - `QuickReplies`: Preset buttons like "Món nào đang hot?" or "Tư vấn món cay".

## UI/UX Preview
- **Glassmorphism Chat window**: `backdrop-blur-xl`, `bg-white/90`, `border-white/20`.
- **Typing Animation**: A subtle three-dot bounce animation.
- **Auto-scroll**: Automatically scroll to the latest message using a `useRef` and `useEffect`.

## Open Questions
- [!IMPORTANT]
  - Should the chat history be cleared when the session ends or persist if the user refreshes the page? (Currently, the plan says Redis stores it for 1 hour).
  - Do you want "Smart Cards" inside the chat (e.g., a dish card with an "Add to Cart" button)?

## Verification Plan
### Automated Tests
- N/A (UI layout validation).

### Manual Verification
- Verify the chat overlay opens/closes smoothly.
- Test sending a message and receiving a response from the backend bot.
- Ensure the "is typing" indicator shows and hides correctly.
- Test responsive layout on both tablet-sized and mobile-sized screen simulations.
