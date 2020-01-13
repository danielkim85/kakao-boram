CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `nickname` varchar(255) NOT NULL,
  `thumbnailImage` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`,`userId`),
  UNIQUE KEY `userId_UNIQUE` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
