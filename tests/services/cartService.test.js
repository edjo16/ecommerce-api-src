// Mock the models
jest.mock('../../models/cart', () => ({
  create: jest.fn(),
  findByPk: jest.fn()
}));

jest.mock('../../models/cartItem', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn()
}));

jest.mock('../../models/product', () => ({
  findByPk: jest.fn()
}));

const CartService = require('../../services/cartService');
const Cart = require('../../models/cart');
const CartItem = require('../../models/cartItem');
const Product = require('../../models/product');

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
    // prueba de CP-01 Crear un carrito para un usuario
  describe('createCart', () => {

      it('CP-01 | Crear carrito para usuario | clase valida', async () => {
          const userId = '1';

          const mockCart = {
              id: 1,
              userId: '1'
          };

          Cart.create.mockResolvedValue(mockCart);

          const result = await CartService.createCart(userId);

          expect(Cart.create).toHaveBeenCalledTimes(1);
          expect(Cart.create).toHaveBeenCalledWith({
              userId: '1'
          });

          expect(result).toEqual(mockCart);
          expect(result.id).toBe(1);
          expect(result.userId).toBe('1');
      }); 
  });

  describe('addItemToCart', () => {
    const mockProduct = { id: 1, inventory: 10, price: 100 };
    const mockCartItem = { cartId: 1, productId: 1, quantity: 2 };

    // Prueba CP-02 Agregar producto con inventario suficiente
      it('CP-02 | Agregar producto con inventario suficiente | clase valida', async () => {
          const cartId = 1;
          const productId = 1;
          const quantity = 2;

          const mockProduct = {
              id: 1,
              name: 'Laptop',
              price: 100,
              inventory: 10
          };

          const mockCartItem = {
              id: 1,
              cartId: 1,
              productId: 1,
              quantity: 2
          };

          // Simular que el producto existe
          Product.findByPk.mockResolvedValue(mockProduct);

          // Simular que el artículo todavía no está en el carrito
          CartItem.findOne.mockResolvedValue(null);

          // Simular la creación del artículo
          CartItem.create.mockResolvedValue(mockCartItem);

          // Ejecutar la función que estamos probando
          const result = await CartService.addItemToCart(
              cartId,
              productId,
              quantity
          );

          // Verificar las llamadas a los modelos
          expect(Product.findByPk).toHaveBeenCalledWith(1);

          expect(CartItem.findOne).toHaveBeenCalledWith({
              where: { cartId: 1, productId: 1 }
          });

          expect(CartItem.create).toHaveBeenCalledTimes(1);

          expect(CartItem.create).toHaveBeenCalledWith({
              cartId: 1,
              productId: 1,
              quantity: 2
          });

          // Comprobar el resultado del servicio
          expect(result).toEqual(mockCartItem);
          expect(result.quantity).toBe(2);
          expect(result.productId).toBe(1);

      });
      // CP-03: Rechazar un producto inexistente
      it('CP-03 | Rechazar producto inexistente | clase invalida', async () => {

          const cartId = 1;
          const productId = 99999;
          const quantity = 2;

          // Simular que el producto no existe
          Product.findByPk.mockResolvedValue(null);

          // Verificar que el servicio rechaza la operación
          await expect(
              CartService.addItemToCart(
                  cartId,
                  productId,
                  quantity
              )
          ).rejects.toThrow('Product not found');

          // Verificar que se buscó el producto inexistente
          expect(Product.findByPk).toHaveBeenCalledWith(99999);

          // Verificar que no se consulta ni crea un artículo
          expect(CartItem.findOne).not.toHaveBeenCalled();
          expect(CartItem.create).not.toHaveBeenCalled();

      });

  });
    //Prueba CP-04 Rechazar cantidad superior al inventario
    it('CP-04 | Rechazar cantidad superior al inventario | clase limite', async () => {
        const mockProduct = {
            id: 1,
            name: 'Laptop',
            price: 100,
            inventory: 10
        };

        Product.findByPk.mockResolvedValue(mockProduct);

        await expect(
            CartService.addItemToCart(1, 1, 11)
        ).rejects.toThrow('Not enough inventory available');

        expect(Product.findByPk).toHaveBeenCalledWith(1);
        expect(CartItem.findOne).not.toHaveBeenCalled();
        expect(CartItem.create).not.toHaveBeenCalled();
    });// Cierre de la prueba CP-04

    // prueba de CP-19 Realizar cantidad acumulada superior al inventario
    it('CP-19 | Rechazar cantidad acumulada superior al inventario | clase limite', async () => {
        const mockProduct = {
            id: 1,
            name: 'Laptop',
            price: 100,
            inventory: 10
        };

        const existingItem = {
            id: 5,
            cartId: 1,
            productId: 1,
            quantity: 8,
            save: jest.fn()
        };

        Product.findByPk.mockResolvedValue(mockProduct);
        CartItem.findOne.mockResolvedValue(existingItem);

        await expect(
            CartService.addItemToCart(1, 1, 3)
        ).rejects.toThrow('Not enough inventory available');

        expect(Product.findByPk).toHaveBeenCalledWith(1);

        expect(CartItem.findOne).toHaveBeenCalledWith({
            where: { cartId: 1, productId: 1 }
        });

        expect(existingItem.quantity).toBe(8);
        expect(existingItem.save).not.toHaveBeenCalled();
        expect(CartItem.create).not.toHaveBeenCalled();
    });//Cierre de la prueba CP-19

    // prueba de CP-20 Aceptar cantidad acumulada igual al inventario
    it('CP-20 | Aceptar cantidad acumulada igual al inventario | clase limite', async () => {
        const mockProduct = {
            id: 1,
            name: 'Laptop',
            price: 100,
            inventory: 10
        };

        const existingItem = {
            id: 5,
            cartId: 1,
            productId: 1,
            quantity: 8,
            save: jest.fn().mockResolvedValue(undefined)
        };

        Product.findByPk.mockResolvedValue(mockProduct);
        CartItem.findOne.mockResolvedValue(existingItem);

        const result = await CartService.addItemToCart(1, 1, 2);

        expect(Product.findByPk).toHaveBeenCalledWith(1);

        expect(CartItem.findOne).toHaveBeenCalledWith({
            where: { cartId: 1, productId: 1 }
        });

        expect(existingItem.quantity).toBe(10);
        expect(existingItem.save).toHaveBeenCalledTimes(1);
        expect(CartItem.create).not.toHaveBeenCalled();

        expect(result.quantity).toBe(10);
    });//Cierre de la prueba CP-20

    //Prueba CP-05 Rechazar cantidad cero
    it('CP-05 | Rechazar cantidad cero | clase limite', async () => {
        const mockProduct = {
            id: 1,
            name: 'Laptop',
            price: 100,
            inventory: 10
        };

        Product.findByPk.mockResolvedValue(mockProduct);
        CartItem.findOne.mockResolvedValue(null);

        await expect(
            CartService.addItemToCart(1, 1, 0)
        ).rejects.toThrow();

        expect(CartItem.create).not.toHaveBeenCalled();
    }); // Cierre de la prueba CP-05

    //Prueba CP-06 Rechazar cantidades negativas
    it('CP-06 | Rechazar cantidad negativa | clase invalida', async () => {
        const mockProduct = {
            id: 1,
            name: 'Laptop',
            price: 100,
            inventory: 10
        };

        Product.findByPk.mockResolvedValue(mockProduct);
        CartItem.findOne.mockResolvedValue(null);

        await expect(
            CartService.addItemToCart(1, 1, -1)
        ).rejects.toThrow();

        expect(CartItem.create).not.toHaveBeenCalled();
    });// Cierre de la prueba CP-06

    // Prueba CP-08 Acumular cantidad del mismo producto
    it('CP-08 | Acumular cantidad del mismo producto | clase valida', async () => {
        const mockProduct = {
            id: 1,
            inventory: 10,
            price: 100
        };

        const existingItem = {
            id: 5,
            cartId: 1,
            productId: 1,
            quantity: 2,
            save: jest.fn().mockResolvedValue(undefined)
        };

        Product.findByPk.mockResolvedValue(mockProduct);
        CartItem.findOne.mockResolvedValue(existingItem);

        const result = await CartService.addItemToCart(1, 1, 3);

        expect(Product.findByPk).toHaveBeenCalledWith(1);

        expect(CartItem.findOne).toHaveBeenCalledWith({
            where: { cartId: 1, productId: 1 }
        });

        expect(existingItem.save).toHaveBeenCalledTimes(1);
        expect(CartItem.create).not.toHaveBeenCalled();

        expect(result).toBe(existingItem);
        expect(result.quantity).toBe(5);
    });//Cierre de la prueba CP-08
    
  describe('getCartItems', () => {
      //Prueba CP-09 Calcular subtotal, impuesto y total
      it('CP-09 | Calcular subtotal impuesto y total | clase valida', async () => {
          const mockCart = {
              id: 1,
              userId: '1'
          };

          const mockItem = {
              id: 1,
              cartId: 1,
              productId: 1,
              quantity: 2,
              Product: {
                  id: 1,
                  name: 'Laptop',
                  price: 100,
                  taxRate: 0.07
              },
              toJSON: jest.fn().mockReturnValue({
                  id: 1,
                  cartId: 1,
                  productId: 1,
                  quantity: 2
              })
          };

          Cart.findByPk.mockResolvedValue(mockCart);
          CartItem.findAll.mockResolvedValue([mockItem]);

          const result = await CartService.getCartItems(1);

          expect(Cart.findByPk).toHaveBeenCalledWith(1);

          expect(CartItem.findAll).toHaveBeenCalledWith({
              where: { cartId: 1 },
              include: Product
          });

          expect(result.items).toHaveLength(1);
          expect(result.items[0].itemSubtotal).toBeCloseTo(200, 2);
          expect(result.items[0].itemTax).toBeCloseTo(14, 2);

          expect(result.summary.subtotal).toBeCloseTo(200, 2);
          expect(result.summary.totalTax).toBeCloseTo(14, 2);
          expect(result.summary.total).toBeCloseTo(214, 2);
      });//Cierre de la prueba CP-09

    });
  });


  describe('updateCartItem', () => {
      //Prueba CP-21 Rechazar actualizacion de articulo inexistente
      it('CP-21 | Rechazar actualizacion de articulo inexistente | clase invalida', async () => {
          const itemId = 99999;
          const quantity = 2;

          CartItem.findByPk.mockResolvedValue(null);

          await expect(
              CartService.updateCartItem(itemId, quantity)
          ).rejects.toThrow('Item not found');

          expect(CartItem.findByPk).toHaveBeenCalledWith(
              99999,
              { include: Product }
          ); //Cierre de la prueba CP-21
      });
  });
//Prueba CP-22 Rechazar actualizacion por inventario insuficiente
it('CP-22 | Rechazar actualización por inventario insuficiente | clase límite', async () => {
    const mockCartItem = {
        id: 5,
        cartId: 1,
        productId: 1,
        quantity: 2,
        Product: {
            id: 1,
            inventory: 10
        },
        save: jest.fn()
    };//Cierre de la prueba CP-22

    CartItem.findByPk.mockResolvedValue(mockCartItem);

    await expect(
        CartService.updateCartItem(5, 11)
    ).rejects.toThrow('Not enough inventory available');

    expect(CartItem.findByPk).toHaveBeenCalledWith(
        5,
        { include: Product }
    );

    expect(mockCartItem.quantity).toBe(2);
    expect(mockCartItem.save).not.toHaveBeenCalled();
});

  describe('removeCartItem', () => {
    it('should remove cart item successfully', async () => {
   
    }); 

  }); 


