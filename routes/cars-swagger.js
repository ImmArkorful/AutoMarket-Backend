/**
 * @swagger
 * tags:
 *   name: Cars
 *   description: Car listings management endpoints
 */

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: Get all car listings
 *     tags: [Cars]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: make
 *         schema:
 *           type: string
 *         description: Car manufacturer filter
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Car model filter
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Manufacturing year filter
 *       - in: query
 *         name: bodyType
 *         schema:
 *           type: string
 *         description: Body type filter (Sedan, SUV, Coupe, etc.)
 *       - in: query
 *         name: fuelType
 *         schema:
 *           type: string
 *         description: Fuel type filter (Petrol, Diesel, Hybrid, Electric)
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *         description: Transmission filter (Automatic, Manual)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           default: active
 *         description: Listing status (active, sold, pending)
 *     responses:
 *       200:
 *         description: List of cars with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Car'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     summary: Get a single car by ID
 *     tags: [Cars]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 car:
 *                   $ref: '#/components/schemas/Car'
 *       404:
 *         description: Car not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/cars:
 *   post:
 *     summary: Create a new car listing
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *               - year
 *               - price
 *             properties:
 *               make:
 *                 type: string
 *                 example: Toyota
 *               model:
 *                 type: string
 *                 example: Corolla
 *               year:
 *                 type: integer
 *                 example: 2020
 *               price:
 *                 type: number
 *                 example: 18000
 *               body_type:
 *                 type: string
 *                 example: Sedan
 *               fuel_type:
 *                 type: string
 *                 example: Petrol
 *               transmission:
 *                 type: string
 *                 example: Automatic
 *               engine:
 *                 type: string
 *                 example: 1800 cm³ (150 kW / 200 HP)
 *               color:
 *                 type: string
 *                 example: White
 *               doors:
 *                 type: integer
 *                 example: 4
 *               co2_emissions:
 *                 type: string
 *                 example: 120 g/km
 *               description:
 *                 type: string
 *                 example: Excellent condition
 *               image_urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["/images/car1.jpg"]
 *               status:
 *                 type: string
 *                 enum: [active, sold, pending]
 *                 default: active
 *     responses:
 *       201:
 *         description: Car listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 car:
 *                   $ref: '#/components/schemas/Car'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/cars/{id}:
 *   put:
 *     summary: Update a car listing
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Car ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               price:
 *                 type: number
 *               body_type:
 *                 type: string
 *               fuel_type:
 *                 type: string
 *               transmission:
 *                 type: string
 *               engine:
 *                 type: string
 *               color:
 *                 type: string
 *               doors:
 *                 type: integer
 *               co2_emissions:
 *                 type: string
 *               description:
 *                 type: string
 *               image_urls:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [active, sold, pending]
 *     responses:
 *       200:
 *         description: Car listing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 car:
 *                   $ref: '#/components/schemas/Car'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner
 *       404:
 *         description: Car not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/cars/{id}:
 *   delete:
 *     summary: Delete a car listing
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car listing deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner
 *       404:
 *         description: Car not found
 *       500:
 *         description: Internal server error
 */
