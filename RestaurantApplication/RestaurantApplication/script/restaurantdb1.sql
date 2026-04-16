-- Xóa cơ sở dữ liệu trước đó (nếu tồn tại để update phiên bản mới nhất )
DROP DATABASE IF EXISTS restaurantdb;

-- Tạo cơ sở dữ liệu mới tên là (clinicdb)
CREATE DATABASE restaurantdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sử dụng cơ sở dữ liệu vừa tạo
USE restaurantdb;

-- Bảng MembershipTier (Hạng thành viên)
CREATE TABLE `membership_tier` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `tier_name` VARCHAR(255) NOT NULL,
    `min_spending` DECIMAL(19, 2) NOT NULL,
    `point_earning_rate` DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    `max_point_redemption_pct` INT DEFAULT 20,
    `description` TEXT
) ENGINE=InnoDB;

INSERT INTO `membership_tier` (`tier_name`, `min_spending`, `point_earning_rate`, `max_point_redemption_pct`, `description`) VALUES
('New Member', 0.00, 1.0, 20, 'Hạng mặc định cho thành viên mới'),
('Silver', 1000000.00, 1.2, 30, 'Hạng Bạc - Tích điểm x1.2 - Dùng điểm tối đa 30%'),
('Gold', 3000000.00, 1.5, 50, 'Hạng Vàng - Tích điểm x1.5 - Dùng điểm tối đa 50%');

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
    `auth_provider` ENUM('LOCAL', 'GOOGLE') NOT NULL,
    `image` VARCHAR(255) DEFAULT NULL,
    `foodPreference` VARCHAR(255) DEFAULT NULL,
    `membership_tier_id` INT,
    `total_spending` DECIMAL(19, 2) DEFAULT 0.00,
    `loyalty_points` INT DEFAULT 0,
    FOREIGN KEY (`membership_tier_id`) REFERENCES `membership_tier`(`id`)
) ENGINE=InnoDB;

-- Bảng LoyaltyConfig (Cấu hình hệ thống Loyalty)
CREATE TABLE `loyalty_config` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `point_to_vnd_rate` INT NOT NULL DEFAULT 100,
    `min_redemption_threshold` INT NOT NULL DEFAULT 500,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO `loyalty_config` (`point_to_vnd_rate`, `min_redemption_threshold`) VALUES (100, 500);

CREATE TABLE `table` (
    `table_id` INT PRIMARY KEY AUTO_INCREMENT,
    `status` ENUM('AVAILABLE', 'BOOKED', 'OCCUPIED') NOT NULL,
    `capacity` INT NOT NULL,
    `table_name` VARCHAR(255)
) ENGINE=InnoDB;
INSERT INTO `table` (`status`, `capacity`, `table_name`) VALUES
('AVAILABLE', 2, 'Bàn 1 (Cửa sổ)'),
('AVAILABLE', 2, 'Bàn 2'),
('AVAILABLE', 4, 'Bàn 3 (Trung tâm)'),
('AVAILABLE', 4, 'Bàn 4'),
('AVAILABLE', 6, 'Bàn 5 (VIP)'),
('AVAILABLE', 8, 'Bàn 6 (Họp mặt)'),
('AVAILABLE', 2, 'Bàn 7'),
('AVAILABLE', 4, 'Bàn 8'),
('AVAILABLE', 10, 'Bàn 9 (Tiệc)'),
('AVAILABLE', 4, 'Bàn 10');


-- Bảng Reservation (đặt bàn tại nhà hàng)
CREATE TABLE `reservation` (
    `reservation_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `table_id` INT NOT NULL,
    `booking_time` DATETIME NOT NULL,
    `checkin_time` DATETIME DEFAULT NULL,
    `checkout_time` DATETIME DEFAULT NULL,
    `status` ENUM('BOOKED', 'CHECKEDIN', 'CHECKEDOUT','REQUEST_PAYMENT') NOT NULL,
    `note` TEXT,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`),
    FOREIGN KEY (`table_id`) REFERENCES `table`(`table_id`)
) ENGINE=InnoDB;
-- INSERT INTO `reservation` (`user_id`, `table_id`, `booking_time`, `checkin_time`, `checkout_time`, `status`, `note`) VALUES


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
-- INSERT INTO `order_session` (`reservation_id`, `session_token`, `create_at`, `expired_at`, `is_active`) VALUES



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
    `applied_voucher_code` VARCHAR(255) DEFAULT NULL,
    `create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_paid` BOOLEAN DEFAULT FALSE,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    FOREIGN KEY (`session_id`) REFERENCES `order_session`(`session_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`online_order_id`) REFERENCES `online_order`(`online_order_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
-- INSERT INTO `order` (`session_id`, `online_order_id`, `create_at`, `is_paid`) VALUES

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
    `description`  VARCHAR(255) ,
    FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FULLTEXT(name) WITH PARSER ngram
) ENGINE=InnoDB;
INSERT INTO `menu_item` (`category_id`, `name`, `price`,`image`, `is_available`, `avg_cooking_time`, `base_cooking_time`, `description`)
VALUES
(1,'Lẩu Đài Bắc 1/2 Nồi ', 89000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092883/60001665-lau-dai-bac_1_2_mqyu8v.jpg',TRUE,1.1,13,'Nước dùng lẩu Đài Bắc đặc trưng với hương vị thanh đạm, ngọt thanh từ xương hầm kết hợp cùng các loại thảo mộc truyền thống. Vị dịu nhẹ, bổ dưỡng, cực kỳ phù hợp cho những ai muốn cân bằng vị giác khi ăn kèm các món cay'),
(1,'Lẩu Mala 1/2 Nồi', 109000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092887/60001563-lau-mala-dai-loan_1_2_xqfdfl.jpg',TRUE,1.3,13,'Nước dùng lẩu Mala cay nồng chuẩn vị Tứ Xuyên với sự kết hợp của ớt khô, hạt tiêu và các gia vị đặc trưng tạo cảm giác tê đầu lưỡi. Hương vị đậm đà, kích thích vị giác mạnh mẽ, là lựa chọn số một cho tín đồ ăn cay.'),
(2,'Ba Chỉ Cừu',79000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092905/bachicuu_fqi7yx.jpg',TRUE,2.8,6,'Những lát thịt cừu thái mỏng với tỷ lệ nạc mỡ cân bằng, tạo độ mềm mượt khi nhúng lẩu. Thịt có mùi thơm đặc trưng của cừu, béo ngậy và rất giàu dinh dưỡng, hòa quyện tuyệt vời với nước lẩu đậm đà.'),
(2,'Má Heo',99000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092912/m_heo_auhnxr.png',TRUE,3.7,6,'Phần thịt má heo có kết cấu độc đáo với những đường gân mỡ li ti xen kẽ, mang lại cảm giác giòn sần sật và béo thơm khi thưởng thức. Đây là lựa chọn thú vị cho những người yêu thích sự dai giòn tự nhiên.'),
(2,'Bắp Heo Mỹ Cuộn',59000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092919/b_p_heo_my_cu_n_j6oebd.jpg',TRUE,5,7,'Thịt bắp heo Mỹ nhập khẩu chất lượng cao, được thái lát tròn đẹp mắt. Thịt chắc, ngọt tự nhiên và ít mỡ, khi nhúng chín vẫn giữ được độ mềm, không bị khô, mang lại vị ngọt thanh cho món lẩu.'),
(2,'Ba Chỉ Heo Iberico',49000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092936/60001584-ba-chi-heo-iberico_2_1_t4ksk9.jpg',TRUE,2.3,6,'Loại heo đen cao cấp từ Tây Ban Nha, nổi tiếng với vân mỡ cẩm thạch và hương thơm hạt dẻ đặc trưng. Thịt mềm như tan trong miệng, mang đẳng cấp ẩm thực thượng hạng với độ béo ngậy tinh tế.'),
(3,'Combo Bò Tươi Phong Dư',279000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092944/co_phong_du_xqtoxe.jpg',TRUE,2.9,11,' Tổng hợp các phần thịt bò tươi ngon nhất trong ngày, được tuyển chọn kỹ lưỡng. Combo mang đến trải nghiệm đa dạng về kết cấu từ mềm mịn đến giòn dai, giữ trọn vẹn vị ngọt nguyên bản của thịt bò tơ.'),
(3,'Thăn Bò Tươi',139000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092954/co_diemthan_1_qdr5ne.jpg',TRUE,3.0,11,'Phần thịt thăn được lóc kỹ, ít mỡ, nhiều nạc nhưng cực kỳ mềm mại. Khi nhúng tái, thăn bò giữ được độ ẩm và vị ngọt sâu, là món ăn tinh túy dành cho những ai yêu thích hương vị bò thuần khiết.'),
(4,'Sách Bò Nâu',79000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092959/sach_bo_nau_pp9yuu.jpg',TRUE,3.1,6,'Sách bò tươi được làm sạch tỉ mỉ, giữ lại màu nâu tự nhiên và độ giòn sần sật đặc trưng. Đây là món nhúng lẩu kinh điển, có khả năng bám nước dùng và nước sốt cực tốt, tạo cảm giác thú vị khi nhai.'),
(4,'Cuống Tim Tươi',69000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092968/cuong_tim_bn5lab.jpg',TRUE,2.4,6,'Phần cuống tim có độ dai giòn cực kỳ bắt vị, không hề có mùi hôi. Đây là món nhắm tuyệt vời trong bữa lẩu, mang lại sự thay đổi khẩu vị với độ giòn cứng vừa phải và vị ngọt nhẹ.'),
(4,'Lưỡi Bò',49000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092980/15l_i_bo_cu_n_aiiqln.jpg',TRUE,2.5,6,'Lưỡi bò thái mỏng là món khoái khẩu nhờ sự kết hợp giữa độ giòn, dai và vị béo nhẹ. Khi chín, lưỡi bò mang đến cảm giác đậm đà, lạ miệng và rất giàu chất sắt.'),
(5,'Sò Điệp',239000.00,'https://res.cloudinary.com/dfi68mgij/image/upload/v1755092988/s_i_p_chpsuw.png',TRUE,5,6,'Cồi sò điệp trắng nõn, tươi rói mang hương vị tinh khiết của biển cả. Thịt sò điệp ngọt lịm, mềm mại và giàu đạm, là điểm nhấn sang trọng giúp nâng tầm bữa tiệc lẩu của bạn.');



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
-- INSERT INTO `order_item` 
-- (`order_id`, `menu_item_id`, `quantity`, `status`, `estimate_time`, `priority_score`, `start_time`, `deadline_time`, `note`) 
-- VALUES
-- (1, 1, 1, 'DONE', 12, 80, '2025-01-10 18:15:00', '2025-01-10 18:27:00', 'Ít cay'),
-- (1, 3, 2, 'DONE', 10, 70, '2025-01-10 18:20:00', '2025-01-10 18:30:00', NULL),

-- (2, 2, 1, 'DONE', 15, 85, '2025-01-15 12:15:00', '2025-01-15 12:30:00', 'Nhiều cay'),
-- (2, 5, 1, 'DONE', 20, 75, '2025-01-15 12:20:00', '2025-01-15 12:40:00', NULL),

-- (3, 4, 2, 'DONE', 18, 90, '2025-03-05 18:25:00', '2025-03-05 18:43:00', NULL),
-- (3, 7, 1, 'DONE', 25, 60, '2025-03-05 18:27:00', '2025-03-05 18:52:00', NULL),

-- (4, 6, 1, 'DONE', 12, 88, '2025-03-18 11:15:00', '2025-03-18 11:27:00', NULL),

-- (5, 8, 2, 'DONE', 30, 92, '2025-05-09 11:35:00', '2025-05-09 12:05:00', NULL),

-- (6, 9, 1, 'DONE', 14, 85, '2025-08-01 19:25:00', '2025-08-01 19:39:00', NULL),
-- (6, 10, 1, 'DONE', 16, 65, '2025-08-01 19:27:00', '2025-08-01 19:43:00', NULL),

-- (7, 11, 1, 'DONE', 20, 70, '2025-08-01 19:30:00', '2025-08-01 19:50:00', NULL),

-- (8, 12, 2, 'DONE', 22, 95, '2025-08-01 19:40:00', '2025-08-01 20:02:00', NULL),

-- (9, 2, 3, 'DONE', 12, 80, '2025-08-01 19:45:00', '2025-08-01 19:57:00', NULL),

-- (10, 4, 2, 'DONE', 18, 88, '2025-10-20 10:20:00', '2025-10-20 10:38:00', NULL),

-- (11, 1, 1, 'DONE', 15, 85, '2025-12-25 18:50:00', '2025-12-25 19:05:00', 'Extra soup');




-- Bảng Voucher (Định nghĩa Voucher)
CREATE TABLE `voucher` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `voucher_code` VARCHAR(255) UNIQUE NOT NULL,
    `voucher_name` VARCHAR(255) NOT NULL,
    `voucher_type` ENUM('PERCENTAGE', 'FIXED') NOT NULL,
    `discount_value` DECIMAL(19, 2) NOT NULL,
    `max_discount_amount` DECIMAL(19, 2),
    `min_order_value` DECIMAL(19, 2) DEFAULT 0.00,
    `start_date` DATETIME NOT NULL,
    `end_date` DATETIME NOT NULL,
    `target_tier_id` INT,
    `is_new_member_voucher` BOOLEAN DEFAULT FALSE,
    `is_level_up_reward` BOOLEAN DEFAULT FALSE,
    `points_required` INT DEFAULT 0,
    `apply_type` ENUM('ONLINE', 'DINE_IN', 'BOTH') NOT NULL DEFAULT 'BOTH',
    `is_point_apply` BOOLEAN DEFAULT TRUE,
    `description` TEXT,
    FOREIGN KEY (`target_tier_id`) REFERENCES `membership_tier`(`id`)
) ENGINE=InnoDB;

INSERT INTO `voucher` (`voucher_code`, `voucher_name`, `voucher_type`, `discount_value`, `max_discount_amount`, `min_order_value`, `start_date`, `end_date`, `is_new_member_voucher`, `apply_type`, `description`) VALUES
('WELCOME50', 'Voucher Chào Mừng', 'PERCENTAGE', 50.00, 50000.00, 100000.00, '2024-01-01 00:00:00', '2026-12-31 23:59:59', TRUE, 'BOTH', 'Giảm 50% tối đa 50k cho thành viên mới');

INSERT INTO `voucher` (`voucher_code`, `voucher_name`, `voucher_type`, `discount_value`, `max_discount_amount`, `min_order_value`, `start_date`, `end_date`, `target_tier_id`, `is_level_up_reward`, `is_point_apply`, `apply_type`, `description`) VALUES
('SILVER10', 'Thăng hạng Bạc', 'PERCENTAGE', 10.00, 100000.00, 200000.00, '2024-01-01 00:00:00', '2026-12-31 23:59:59', 2, TRUE, TRUE, 'BOTH', 'Giảm 10% tối đa 100k mừng lên hạng Bạc');

-- Bảng UserVoucher (Kho Voucher của khách)
CREATE TABLE `user_voucher` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `voucher_id` INT NOT NULL,
    `is_used` BOOLEAN DEFAULT FALSE,
    `is_locked` BOOLEAN DEFAULT FALSE,
    `locked_at` DATETIME,
    `acquired_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `used_at` DATETIME,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`),
    FOREIGN KEY (`voucher_id`) REFERENCES `voucher`(`id`)
) ENGINE=InnoDB;

-- Bảng MembershipHistory (Lịch sử thăng hạng)
CREATE TABLE `membership_history` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `old_tier_id` INT,
    `new_tier_id` INT NOT NULL,
    `changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`),
    FOREIGN KEY (`old_tier_id`) REFERENCES `membership_tier`(`id`),
    FOREIGN KEY (`new_tier_id`) REFERENCES `membership_tier`(`id`)
) ENGINE=InnoDB;

-- Bảng Bill (hóa đơn thanh toán)
CREATE TABLE `bill` (
    `bill_id` INT PRIMARY KEY AUTO_INCREMENT,
    `order_id` INT NOT NULL,
    `create_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `sub_total` DECIMAL(19, 2) NOT NULL,
    `discount_amount` DECIMAL(19, 2) DEFAULT 0.00,
    `vat_amount` DECIMAL(19, 2) DEFAULT 0.00,
    `total_amount` DECIMAL(19, 2) NOT NULL,
    `status` ENUM('UNPAID', 'PAID', 'CANCELED') NOT NULL,
    `payment_time` DATETIME,
    `voucher_id` INT,
    FOREIGN KEY (`order_id`) REFERENCES `order`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`voucher_id`) REFERENCES `voucher`(`id`)
) ENGINE=InnoDB;

-- Bảng PointTransaction (Lịch sử điểm thưởng)
CREATE TABLE `point_transaction` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `base_points` INT DEFAULT 0,
    `bonus_points` INT DEFAULT 0,
    `amount` INT NOT NULL,
    `transaction_type` ENUM('EARN', 'REDEEM', 'ADJUST') NOT NULL,
    `description` TEXT,
    `bill_id` INT,
    `user_voucher_id` INT,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`),
    FOREIGN KEY (`bill_id`) REFERENCES `bill`(`bill_id`),
    FOREIGN KEY (`user_voucher_id`) REFERENCES `user_voucher`(`id`)
) ENGINE=InnoDB;

-- Đánh Index để tối ưu truy vấn
ALTER TABLE `voucher` ADD INDEX `idx_voucher_code` (`voucher_code`);
ALTER TABLE `point_transaction` ADD INDEX `idx_user_id` (`user_id`);
ALTER TABLE `user_voucher` ADD INDEX `idx_user_status` (`user_id`, `is_used`);
-- INSERT INTO `bill` (`order_id`, `create_at`, `sub_total`, `discount_amount`, `total_amount`, `status`, `payment_time`) VALUES
-- (1, '2025-01-10 20:00:00', 247000.00, 0.00, 247000.00, 'PAID', '2025-01-10 20:05:00'),
-- (2, '2025-01-15 14:30:00', 208000.00, 8000.00, 200000.00, 'PAID', '2025-01-15 14:35:00'),
-- (3, '2025-03-05 20:30:00', 179000.00, 0.00, 179000.00, 'PAID', '2025-03-05 20:35:00'),
-- (4, '2025-03-18 13:30:00', 49000.00, 0.00, 49000.00, 'UNPAID', NULL),
-- (5, '2025-05-09 13:00:00', 278000.00, 0.00, 278000.00, 'PAID', '2025-05-09 13:05:00'),
-- (6, '2025-08-01 20:55:00', 148000.00, 0.00, 148000.00, 'PAID', '2025-08-01 21:00:00'),
-- (7, '2025-08-01 20:55:00', 49000.00, 0.00, 49000.00, 'UNPAID', NULL),
-- (8, '2025-08-01 20:55:00', 478000.00, 20000.00, 458000.00, 'PAID', '2025-08-01 21:05:00'),
-- (9, '2025-08-01 20:55:00', 327000.00, 0.00, 327000.00, 'PAID', '2025-08-01 21:10:00'),
-- (10,'2025-10-20 12:00:00', 99000.00, 0.00, 99000.00, 'PAID', '2025-10-20 12:05:00'),
-- (11,'2025-12-25 21:30:00', 89000.00, 0.00, 89000.00, 'PAID', '2025-12-25 21:35:00');
;
