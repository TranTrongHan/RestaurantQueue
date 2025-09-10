# Development of an Automated Food Distribution Support System for Large Restaurants  

## 📖 Overview  
The **Automated Food Distribution Support System** is designed to optimize **order management and kitchen assignment** in large-scale restaurants.  

This system ensures faster service and better resource utilization by:  
-  Allowing customers to place orders via web applications  
-  Automatically distributing dishes to kitchens based on a **priority score**  
-  Using **Redis Sorted Set** for order scheduling and prioritization  
-  Tracking order lifecycle events through **Redis Streams**  
-  Keeping clients updated in real time via **Firebase Firestore**  

---

## 🧮 Priority Score Algorithm  
Orders are prioritized using the following formula:  

priorityScore = α * waitTime + β * avgCookingTime + γ * vipPriority

- ⏳ **waitTime** – Time a customer has been waiting  
- 🍲 **avgCookingTime** – Average cooking time, updated dynamically using EMA  
- ⭐ **vipPriority** – Weight assigned to VIP customers  

The system ensures that **high-priority orders** are always processed first by leveraging **Redis Sorted Set**.  


## 🏗️ System Architecture  
-  **Frontend**: React + Vite  
-  **Backend**: Spring Boot (Java 21)  
-  **Database**: MySQL (core data storage)  
-  **Redis**:  
  - **Sorted Set** → order scheduling & prioritization  
  - **Stream** → event logging & monitoring  
-  **Firebase Firestore**: real-time data synchronization across clients  


## 📌 Project Status  
 This system is **currently under development**.  
- Features are being incrementally implemented.  
- Unit and integration tests are being written to ensure reliability.  
- Future work will focus on optimization, and deployment. 