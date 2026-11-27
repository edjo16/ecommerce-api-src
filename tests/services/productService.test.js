// Mock the models before requiring the service
jest.mock('../../models/product', () => ({
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    belongsTo: jest.fn()  // Mock the association method
  }));

  jest.mock('../../models/category', () => ({
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }));

  // Now require the service after the mocks are set up
  const ProductService = require('../../services/productService');
  const Product = require('../../models/product');
const Category = require('../../models/category');
// Limpiar los mocks antes de todas las pruebas del archivo

beforeEach(() => {
    jest.clearAllMocks();
});



describe('ProductService', () => {
    // Clear all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllProducts', () => {
        // Prueba de CP-16 Consultar productos sin filtros opcionales
        it('CP-16 | Consultar productos sin filtros opcionales | clase valida', async () => {
            const mockProducts = [
                { id: 1, name: 'Laptop', price: 500, categoryId: 1 },
                { id: 2, name: 'Mouse', price: 50, categoryId: 1 }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const result = await ProductService.getProductsByCategory(1);

            expect(Product.findAll).toHaveBeenCalledTimes(1);

            expect(Product.findAll).toHaveBeenCalledWith({
                where: { categoryId: 1 },
                include: Category
            });

            expect(result).toEqual(mockProducts);
            expect(result).toHaveLength(2);
        });// Cierre de la prueba CP-16


        });
    });

    describe('getProductById', () => {
        it('should return a product when product exists', async () => {

        });
    });

    describe('createProduct', () => {
        //Prueba CP-10 Crear Producto con categoria existente
        it('CP-10 | Crear producto con categoria existente | clase valida', async () => {
            const productData = {
                name: 'Laptop',
                price: 500,
                inventory: 10,
                categoryId: 1
            };

            const mockCategory = {
                id: 1,
                name: 'Electronics'
            };

            const mockProduct = {
                id: 10,
                ...productData
            };

            Category.findByPk.mockResolvedValue(mockCategory);
            Product.create.mockResolvedValue(mockProduct);

            const result = await ProductService.createProduct(productData);

            expect(Category.findByPk).toHaveBeenCalledWith(1);
            expect(Product.create).toHaveBeenCalledTimes(1);
            expect(Product.create).toHaveBeenCalledWith(productData);

            expect(result).toEqual(mockProduct);
            expect(result.id).toBe(10);
            expect(result.categoryId).toBe(1);
        }); // Cierre de la prueba CP - 10

           //Prueba CP-11 Rechazzar categoria inexistente
        it('CP-11 | Rechazar categoria inexistente | clase invalida', async () => {
            const productData = {
                name: 'Laptop',
                price: 500,
                inventory: 10,
                categoryId: 99999
            };

            Category.findByPk.mockResolvedValue(null);

            await expect(
                ProductService.createProduct(productData)
            ).rejects.toThrow(
                'Category with id 99999 does not exist'
            );

            expect(Category.findByPk).toHaveBeenCalledWith(99999);
            expect(Product.create).not.toHaveBeenCalled();
        }); // Cierre de la prueba CP - 11
    }); // Cierra describe('createProduct')
 
    describe('getProductsByCategory', () => {
        //Prueba CP-12 Consultar productos filtrados
        it('CP-12 | Consultar productos filtrados | clase valida', async () => {
            const mockProducts = [
                { id: 2, name: 'Laptop', price: 500, categoryId: 1 },
                { id: 3, name: 'Mouse', price: 50, categoryId: 1 }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const result = await ProductService.getProductsByCategory(
                1,
                {
                    sort: 'price,DESC',
                    limit: '2',
                    offset: '1'
                }
            );

            expect(Product.findAll).toHaveBeenCalledTimes(1);

            expect(Product.findAll).toHaveBeenCalledWith({
                where: { categoryId: 1 },
                include: Category,
                order: [['price', 'DESC']],
                limit: 2,
                offset: 1
            });

            expect(result).toEqual(mockProducts);
            expect(result).toHaveLength(2);
        });//Cierre de la prueba CP- 12

        });
  

    describe('getProductsByCategories', () => {
        // Prueba CP-17 Rechazar consulta sin categorias 
        it('CP-17 | Rechazar consulta sin categorias | clase invalida', async () => {
            const categoryIdsStr = '';

            await expect(
                ProductService.getProductsByCategories(categoryIdsStr)
            ).rejects.toThrow('Categories parameter is required');

            expect(Product.findAll).not.toHaveBeenCalled();
        });//Cierre de la prueba CP-17

        // Prueba CP-18 Consultar multiples categorias  
        it('CP-18 | Consultar múltiples categorias | clase valida', async () => {
            const { Op } = require('sequelize');

            const mockProducts = [
                { id: 1, name: 'Laptop', categoryId: 1, price: 500 },
                { id: 2, name: 'Mouse', categoryId: 2, price: 50 }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const result = await ProductService.getProductsByCategories('1,2');

            expect(Product.findAll).toHaveBeenCalledTimes(1);

            expect(Product.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        categoryId: {
                            [Op.in]: [1, 2]
                        }
                    },
                    include: Category
                })
            );

            expect(result).toEqual(mockProducts);
            expect(result).toHaveLength(2);
        });//Cierre de la prueba CP-18

        });
  
describe('updateProduct', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Category.findByPk.mockClear();
        Product.update.mockClear();
    });
        //Prueba CP-13 Rechazar actualización con categoria inexistente
        it('CP-13 | Rechazar actualización con categoria inexistente | clase invalida', async () => {
            const productId = 10;

            const productData = {
                name: 'Laptop actualizada',
                categoryId: 99999
            };

            Category.findByPk.mockResolvedValue(null);

            await expect(
                ProductService.updateProduct(productId, productData)
            ).rejects.toThrow(
                'Category with id 99999 does not exist'
            );

            expect(Category.findByPk).toHaveBeenCalledWith(99999);
            expect(Product.update).not.toHaveBeenCalled();
        });//Cierre de la prueba CP-13

        //Prueba CP-14 Actualizar producto con categoria inexistente
        it('CP-14 | Actualizar producto con categoria existente | clase valida', async () => {
            const productId = 10;

            const productData = {
                name: 'Laptop actualizada',
                categoryId: 2
            };

            const mockCategory = {
                id: 2,
                name: 'Computadoras'
            };

            Category.findByPk.mockResolvedValue(mockCategory);
            Product.update.mockResolvedValue([1]);

            const result = await ProductService.updateProduct(
                productId,
                productData
            );

            expect(Category.findByPk).toHaveBeenCalledTimes(1);
            expect(Category.findByPk).toHaveBeenCalledWith(2);

            expect(Product.update).toHaveBeenCalledTimes(1);
            expect(Product.update).toHaveBeenCalledWith(
                productData,
                { where: { id: 10 } }
            );

            expect(result).toEqual([1]);
        });//Cierre de la prueba CP-14

        //Prueba CP-15 Actualizar producto sin cambiar categoria 
        it('CP-15 | Actualizar producto sin cambiar categoria | clase valida', async () => {
            // Datos concretos de entrada
            const productId = 10;

            const productData = {
                name: 'Laptop Lenovo actualizada',
                price: 650
            };

            // Simular una actualización exitosa de un registro
            Product.update.mockResolvedValue([1]);

            // Ejecutar el servicio
            const result = await ProductService.updateProduct(
                productId,
                productData
            );

            // Verificar que no se consulte la categoría
            expect(Category.findByPk).not.toHaveBeenCalled();

            // Verificar que se ejecute la actualización
            expect(Product.update).toHaveBeenCalledTimes(1);

            expect(Product.update).toHaveBeenCalledWith(
                productData,
                { where: { id: 10 } }
            );

            // Verificar el resultado del modelo simulado
            expect(result).toEqual([1]);
        }); //Cierre de la prueba CP-15


        });

    describe('deleteProduct', () => {
        it('should delete a product', async () => {

        });
    });
