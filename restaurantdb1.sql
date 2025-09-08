-- Xóa cơ sở dữ liệu trước đó (nếu tồn tại để update phiên bản mới nhất )
DROP DATABASE IF EXISTS restaurantdb;

-- Tạo cơ sở dữ liệu mới tên là (clinicdb)
CREATE DATABASE restaurantdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sử dụng cơ sở dữ liệu vừa tạo
USE restaurantdb;

-- Bảng User (đại diện cho mọi người dùng)
CREATE TABLE `user` (
    `user_id` INT PRIMARY KEY AUTO_INCREMENT,
    `full_name` VARCHAR(255) NOT NULL,
    `dob` DATE,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `phone` VARCHAR(255),
    `address` VARCHAR(255),
    `username` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255),
    `role` ENUM('CUSTOMER', 'CHEF', 'STAFF','ADMIN') NOT NULL,
	`is_vip` BOOLEAN DEFAULT NULL,
    `auth_provider` ENUM('LOCAL', 'GOOGLE') NOT NULL,
    `image` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;
INSERT INTO `user` (`full_name`, `dob`, `email`, `phone`,`address`, `username`, `password`, `role`,`auth_provider`) VALUES
('Le Thi B', '1988-11-20', 'lethib@example.com', '0987654321','TPHCM', 'lethib_chef', 'chefpass', 'CHEF','LOCAL'),
('Hoang Thi E', '1985-02-10', 'hoangthe@example.com', '0903344556','TPHCM', 'hoange_chef', 'chefpass2', 'CHEF','LOCAL'),
('Nguyen Van A', '1985-02-10', 'vân@example.com', '0903344556','TPHCM', 'vana', '123456', 'CUSTOMER','LOCAL'),
('Tran D', '1985-02-10', 'd@example.com', '0903344556','TPHCM', 'd', '123456', 'CUSTOMER','LOCAL');
-- Bảng Chef (thuộc tính riêng của đầu bếp)
CREATE TABLE `chef` (
    `user_id` INT PRIMARY KEY,
    `is_available` BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
INSERT INTO `chef` (`user_id`, `is_available`) VALUES
(1, TRUE),
(2, TRUE);

-- Bảng bình luận
CREATE TABLE `comments` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `content` VARCHAR(500) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `rating` TINYINT UNSIGNED NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `is_spam` BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO `comments` (`user_id`, `content`, `created_at`, `rating`, `status`, `is_spam`) VALUES
(1, 'Món ăn rất ngon, phục vụ nhanh chóng!', NOW() - INTERVAL 2 DAY, 5, 'APPROVED', FALSE),
(2, 'Không gian quán hơi ồn nhưng đồ ăn ok.', NOW() - INTERVAL 1 DAY, 4, 'APPROVED', FALSE),
(3, 'Phục vụ chưa được nhiệt tình lắm.', NOW() - INTERVAL 5 HOUR, 3, 'PENDING', FALSE),
(4, 'Tôi bị phục vụ nhầm món, khá thất vọng.', NOW() - INTERVAL 3 DAY, 2, 'APPROVED', FALSE),
(1, 'Đồ ăn dở, không quay lại nữa.', NOW() - INTERVAL 7 DAY, 1, 'REJECTED', TRUE),
(2, 'Mình rất thích lẩu Đài Bắc ở đây, sẽ giới thiệu bạn bè.', NOW() - INTERVAL 10 HOUR, 5, 'APPROVED', FALSE),
(3, 'Quán đẹp, nhân viên thân thiện.', NOW() - INTERVAL 15 HOUR, 4, 'APPROVED', FALSE),
(4, 'Món Bò ra hơi chậm, mong quán cải thiện.', NOW() - INTERVAL 20 HOUR, 3, 'PENDING', FALSE);

-- Bảng Table (quản lý thông tin các bàn ăn)
CREATE TABLE `table` (
    `table_id` INT PRIMARY KEY AUTO_INCREMENT,
    `status` ENUM('AVAILABLE', 'BOOKED', 'OCCUPIED') NOT NULL,
    `capacity` INT NOT NULL,
    `table_name` VARCHAR(255)
) ENGINE=InnoDB;
INSERT INTO `table` (`status`, `capacity`, `table_name`) VALUES
('AVAILABLE', 4, 'Table 1'),
('AVAILABLE', 6, 'Table 2'),
('AVAILABLE', 2, 'Table 3'),
('AVAILABLE', 8, 'Table 4');


-- Bảng Reservation (đặt bàn tại nhà hàng)
CREATE TABLE `reservation` (
    `reservation_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `table_id` INT NOT NULL,
    `booking_time` DATETIME NOT NULL,
    `checkin_time` DATETIME DEFAULT NULL,
    `checkout_time` DATETIME DEFAULT NULL,
    `status` ENUM('BOOKED', 'CHECKEDIN', 'CHECKEDOUT') NOT NULL,
    `note` TEXT,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`),
    FOREIGN KEY (`table_id`) REFERENCES `table`(`table_id`)
) ENGINE=InnoDB;
INSERT INTO `reservation` (`user_id`, `table_id`, `booking_time`, `checkin_time`, `checkout_time`, `status`, `note`) VALUES
-- January
(3, 1, '2025-01-10 09:00:00', '2025-01-10 18:00:00', '2025-01-10 20:00:00', 'CHECKEDOUT', 'Tiệc bạn bè'),
(4, 2, '2025-01-15 11:00:00', '2025-01-15 12:00:00', '2025-01-15 14:30:00', 'CHECKEDOUT', 'Gia đình'),

-- March
(3, 1, '2025-03-05 17:00:00', '2025-03-05 18:10:00', '2025-03-05 20:30:00', 'CHECKEDOUT', 'Sinh nhật'),
(4, 3, '2025-03-18 10:00:00', '2025-03-18 11:00:00', '2025-03-18 13:30:00', 'CHECKEDOUT', 'Khách công ty'),

-- May
(3, 2, '2025-05-09 10:00:00', '2025-05-09 11:20:00', '2025-05-09 13:00:00', 'CHECKEDOUT', 'Tiệc gia đình'),

-- August 
(4, 2, '2025-08-01 10:00:00', '2025-08-01 18:55:00','2025-08-01 20:55:00', 'CHECKEDOUT', 'Sinh nhật'),
(3, 3, '2025-08-01 10:00:00', '2025-08-01 18:55:00','2025-08-01 20:55:00', 'CHECKEDOUT', 'Sinh nhật'),
(4, 1, '2025-08-01 10:00:00', '2025-08-01 18:55:00','2025-08-01 20:55:00', 'CHECKEDOUT', 'Sinh nhật'),
(3, 3, '2025-08-01 10:00:00', '2025-08-01 18:55:00','2025-08-01 20:55:00', 'CHECKEDOUT', 'Sinh nhật'),

-- October
(3, 2, '2025-10-20 09:30:00', '2025-10-20 10:00:00', '2025-10-20 12:00:00', 'CHECKEDOUT', 'Hội họp bạn cũ'),

-- December
(4, 1, '2025-12-25 18:00:00', '2025-12-25 18:30:00', '2025-12-25 21:30:00', 'CHECKEDOUT', 'Giáng sinh');
;


-- Bảng OrderSession (phiên đặt món tại bàn sau khi checkin)
CREATE TABLE `order_session` (
    `session_id` INT PRIMARY KEY AUTO_INCREMENT,
    `reservation_id` INT NOT NULL UNIQUE,
    `session_token` VARCHAR(255) UNIQUE NOT NULL,
    `create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`expired_at` DATETIME NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (`reservation_id`) REFERENCES `reservation`(`reservation_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
INSERT INTO `order_session` (`reservation_id`, `session_token`, `create_at`, `expired_at`, `is_active`) VALUES
(1, 'token_r1', '2025-01-10 18:05:00', '2025-01-10 22:00:00', TRUE),
(2, 'token_r2', '2025-01-15 12:05:00', '2025-01-15 15:00:00', TRUE),
(3, 'token_r3', '2025-03-05 18:15:00', '2025-03-05 22:00:00', TRUE),
(4, 'token_r4', '2025-03-18 11:05:00', '2025-03-18 15:00:00', TRUE),
(5, 'token_r5', '2025-05-09 11:25:00', '2025-05-09 14:00:00', TRUE),
(6, 'token_r6', '2025-08-01 19:00:00', '2025-08-01 23:00:00', TRUE),
(7, 'token_r7', '2025-08-01 19:05:00', '2025-08-01 23:00:00', TRUE),
(8, 'token_r8', '2025-08-01 19:10:00', '2025-08-01 23:00:00', TRUE),
(9, 'token_r9', '2025-08-01 19:15:00', '2025-08-01 23:00:00', TRUE),
(10, 'token_r10','2025-10-20 10:10:00', '2025-10-20 14:00:00', TRUE),
(11, 'token_r11','2025-12-25 18:40:00', '2025-12-25 23:00:00', TRUE);
;


-- Bảng OnlineOrder (đơn hàng online)
CREATE TABLE `online_order` (
    `online_order_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `delivery_address` TEXT NOT NULL,
    `create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `note` TEXT,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`)
) ENGINE=InnoDB;


-- Bảng Order (tổng hợp các đơn hàng)
CREATE TABLE `order` (
    `order_id` INT PRIMARY KEY AUTO_INCREMENT,
    `session_id` INT NULL UNIQUE,
    `online_order_id` INT NULL UNIQUE,
    `create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_paid` BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (`session_id`) REFERENCES `order_session`(`session_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`online_order_id`) REFERENCES `online_order`(`online_order_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
INSERT INTO `order` (`session_id`, `online_order_id`, `create_at`, `is_paid`) VALUES
(1, NULL, '2025-01-10 18:10:00', TRUE),
(2, NULL, '2025-01-15 12:10:00', TRUE),
(3, NULL, '2025-03-05 18:20:00', TRUE),
(4, NULL, '2025-03-18 11:10:00', FALSE),
(5, NULL, '2025-05-09 11:30:00', TRUE),
(6, NULL, '2025-08-01 19:20:00', TRUE),
(7, NULL, '2025-08-01 19:25:00', FALSE),
(8, NULL, '2025-08-01 19:30:00', TRUE),
(9, NULL, '2025-08-01 19:35:00', TRUE),
(10, NULL, '2025-10-20 10:15:00', TRUE),
(11, NULL, '2025-12-25 18:45:00', TRUE);
;
-- Bảng Category ( loại món ăn) 
CREATE TABLE `category` (
	`category_id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL
) ENGINE=InnoDB;
INSERT INTO `category` (`name`) VALUES
('Lẩu'),
('Heo - Cừu'),
('Bò'),
('Nội tạng'),
('Hải sản');

-- Bảng MenuItem (danh sách món ăn)
CREATE TABLE `menu_item` (
    `menu_item_id` INT PRIMARY KEY AUTO_INCREMENT,
    `category_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
	`image` VARCHAR(255) DEFAULT NULL,
    `is_available` BOOLEAN DEFAULT TRUE,
    `avg_cooking_time` DOUBLE PRECISION,
    `base_cooking_time` DOUBLE PRECISION,
    FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
INSERT INTO `menu_item` (`category_id`, `name`, `price`,`image`, `is_available`, `avg_cooking_time`, `base_cooking_time`)
VALUES
(1,'Lẩu Đài Bắc 1/2 Nồi ', 89000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092883/60001665-lau-dai-bac_1_2_mqyu8v.jpg',TRUE,1.1,13),
(1,'Lẩu Mala 1/2 Nồi', 109000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092887/60001563-lau-mala-dai-loan_1_2_xqfdfl.jpg',TRUE,1.3,13),
(2,'Ba Chỉ Cừu',79000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092905/bachicuu_fqi7yx.jpg',TRUE,2.8,6),
(2,'Má Heo',99000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092912/m_heo_auhnxr.png',TRUE,3.7,6),
(2,'Bắp Heo Mỹ Cuộn',59000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092919/b_p_heo_my_cu_n_j6oebd.jpg',TRUE,5,7),
(2,'Ba Chỉ Heo Iberico',49000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092936/60001584-ba-chi-heo-iberico_2_1_t4ksk9.jpg',TRUE,2.3,6),
(3,'Combo Bò Tươi Phong Dư',279000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092944/co_phong_du_xqtoxe.jpg',TRUE,2.9,11),
(3,'Thăn Bò Tươi',139000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092954/co_diemthan_1_qdr5ne.jpg',TRUE,3.0,11),
(4,'Sách Bò Nâu',79000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092959/sach_bo_nau_pp9yuu.jpg',TRUE,3.1,6),
(4,'Cuống Tim Tươi',69000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092968/cuong_tim_bn5lab.jpg',TRUE,2.4,6),
(4,'Lưỡi Bò',49000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092980/15l_i_bo_cu_n_aiiqln.jpg',TRUE,2.5,6),
(5,'Sò Điệp',239000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092988/s_i_p_chpsuw.png',TRUE,5,6);



-- Bảng online_cart (Giỏ hàng online tạm thời)
CREATE TABLE `online_cart` (
    `cart_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `menu_item_id` INT NOT NULL,
    `quantity` INT NOT NULL,
    `added_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item`(`menu_item_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
-- Thêm một vài món vào giỏ hàng của user_id = 4
-- INSERT INTO `online_cart` (`user_id`, `menu_item_id`, `quantity`) VALUES
-- (4, 2, 2),
-- (4, 4, 3);


-- Bảng OrderItem (chi tiết từng món trong đơn hàng)
CREATE TABLE `order_item` (
    `order_item_id` INT PRIMARY KEY AUTO_INCREMENT,
    `order_id` INT NOT NULL,
    `menu_item_id` INT NOT NULL,
    `quantity` INT NOT NULL,
    `status` ENUM('PENDING', 'COOKING', 'DONE', 'CANCELED', 'ONHOLD') NOT NULL,
    `estimate_time` DOUBLE,
    `priority_score` DOUBLE,
    `start_time` DATETIME,
    `deadline_time` DATETIME,
    `note` TEXT,
    FOREIGN KEY (`order_id`) REFERENCES `order`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`menu_item_id`) REFERENCES `menu_item`(`menu_item_id`)
) ENGINE=InnoDB;
INSERT INTO `order_item` 
(`order_id`, `menu_item_id`, `quantity`, `status`, `estimate_time`, `priority_score`, `start_time`, `deadline_time`, `note`) 
VALUES
(1, 1, 1, 'DONE', 12, 80, '2025-01-10 18:15:00', '2025-01-10 18:27:00', 'Ít cay'),
(1, 3, 2, 'DONE', 10, 70, '2025-01-10 18:20:00', '2025-01-10 18:30:00', NULL),

(2, 2, 1, 'DONE', 15, 85, '2025-01-15 12:15:00', '2025-01-15 12:30:00', 'Nhiều cay'),
(2, 5, 1, 'DONE', 20, 75, '2025-01-15 12:20:00', '2025-01-15 12:40:00', NULL),

(3, 4, 2, 'DONE', 18, 90, '2025-03-05 18:25:00', '2025-03-05 18:43:00', NULL),
(3, 7, 1, 'DONE', 25, 60, '2025-03-05 18:27:00', '2025-03-05 18:52:00', NULL),

(4, 6, 1, 'DONE', 12, 88, '2025-03-18 11:15:00', '2025-03-18 11:27:00', NULL),

(5, 8, 2, 'DONE', 30, 92, '2025-05-09 11:35:00', '2025-05-09 12:05:00', NULL),

(6, 9, 1, 'DONE', 14, 85, '2025-08-01 19:25:00', '2025-08-01 19:39:00', NULL),
(6, 10, 1, 'DONE', 16, 65, '2025-08-01 19:27:00', '2025-08-01 19:43:00', NULL),

(7, 11, 1, 'DONE', 20, 70, '2025-08-01 19:30:00', '2025-08-01 19:50:00', NULL),

(8, 12, 2, 'DONE', 22, 95, '2025-08-01 19:40:00', '2025-08-01 20:02:00', NULL),

(9, 2, 3, 'DONE', 12, 80, '2025-08-01 19:45:00', '2025-08-01 19:57:00', NULL),

(10, 4, 2, 'DONE', 18, 88, '2025-10-20 10:20:00', '2025-10-20 10:38:00', NULL),

(11, 1, 1, 'DONE', 15, 85, '2025-12-25 18:50:00', '2025-12-25 19:05:00', 'Extra soup');

-- Bảng KitchenAssignment (phân công món ăn cho đầu bếp)
CREATE TABLE `kitchen_assignment` (
    `kitchen_assign_id` INT PRIMARY KEY AUTO_INCREMENT,
    `chef_id` INT NOT NULL,
    `order_item_id` INT NOT NULL UNIQUE,
    `start_at` DATETIME NOT NULL,
    `finish_at` DATETIME,
    `deadline_time` DATETIME,
    `status` ENUM( 'COOKING', 'DONE') NOT NULL,
    `actual_cooking_time` DOUBLE PRECISION,
    FOREIGN KEY (`chef_id`) REFERENCES `chef`(`user_id`),
    FOREIGN KEY (`order_item_id`) REFERENCES `order_item`(`order_item_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


-- Bảng Bill (hóa đơn thanh toán)
CREATE TABLE `bill` (
    `bill_id` INT PRIMARY KEY AUTO_INCREMENT,
    `order_id` INT NOT NULL,
    `create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `sub_total` DECIMAL(10, 2) NOT NULL,
    `discount_amount` DECIMAL(10, 2) DEFAULT 0.00,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('UNPAID', 'PAID', 'CANCELED') NOT NULL,
    `payment_time` DATETIME,
    FOREIGN KEY (`order_id`) REFERENCES `order`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
INSERT INTO `bill` (`order_id`, `create_at`, `sub_total`, `discount_amount`, `total_amount`, `status`, `payment_time`) VALUES
(1, '2025-01-10 20:00:00', 247000.00, 0.00, 247000.00, 'PAID', '2025-01-10 20:05:00'),
(2, '2025-01-15 14:30:00', 208000.00, 8000.00, 200000.00, 'PAID', '2025-01-15 14:35:00'),
(3, '2025-03-05 20:30:00', 179000.00, 0.00, 179000.00, 'PAID', '2025-03-05 20:35:00'),
(4, '2025-03-18 13:30:00', 49000.00, 0.00, 49000.00, 'UNPAID', NULL),
(5, '2025-05-09 13:00:00', 278000.00, 0.00, 278000.00, 'PAID', '2025-05-09 13:05:00'),
(6, '2025-08-01 20:55:00', 148000.00, 0.00, 148000.00, 'PAID', '2025-08-01 21:00:00'),
(7, '2025-08-01 20:55:00', 49000.00, 0.00, 49000.00, 'UNPAID', NULL),
(8, '2025-08-01 20:55:00', 478000.00, 20000.00, 458000.00, 'PAID', '2025-08-01 21:05:00'),
(9, '2025-08-01 20:55:00', 327000.00, 0.00, 327000.00, 'PAID', '2025-08-01 21:10:00'),
(10,'2025-10-20 12:00:00', 99000.00, 0.00, 99000.00, 'PAID', '2025-10-20 12:05:00'),
(11,'2025-12-25 21:30:00', 89000.00, 0.00, 89000.00, 'PAID', '2025-12-25 21:35:00');
;
-- Bảng Promotion
CREATE TABLE `promotions`(
    `id`INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `usage_count` INT DEFAULT 0
);
INSERT INTO promotions (name, value, usage_count)
VALUES
('DISCOUNT10', 0.10, 2),
('DISCOUNT15', 0.15, 2);CREATE TABLE `comments` (     `id` INT PRIMARY KEY AUTO_INCREMENT,     `user_id` INT NOT NULL,     `content` VARCHAR(500) NOT NULL,     `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,     `rating ` TINYINT UNSIGNED NOT NULL CHECK (`rating` BETWEEN 1 AND 5),     `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',     `is_spam` BOOLEAN NOT NULL DEFAULT FALSE,     FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE )
