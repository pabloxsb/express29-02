const fs = require("fs");

class ProductManager {

  constructor(path) {
    this.path = path;
  }

  async getProducts(limit) {
    try {
      if (fs.existsSync(this.path)) {
        const result = await fs.promises.readFile(this.path, "utf-8");
        const products = JSON.parse(result);
        if (limit) return this.#getProductsLimited(products, limit);
        return products;
      } else {
        return [];
      }
    } catch (error) {
      return console.log(
        "Err. al cargar: Ha ocurrido un error al cargar los datos."
      );
    }
  }

  async getProductById(id) {
    const products = await this.getProducts();

    if (!this.#product_exists(products, id))
      return false;

    let result;

    products.forEach((product) => {
      if (Object.values(product).includes(id)) {
        result = product;
      }
    });

    return result;
  }

  async addProduct(data) { 
    const products = await this.getProducts();
    const product = {
      id: this.#generateId(products),
      ...data //title, description, price, thumbnail, code, stock
    };

    if (this.#code_exists(product.code, products))
      return {status: false, message: 'Err. Codigo duplicado: Ya existe un producto con este codigo.'}
    if (this.#validate_fields(product))
      return {status: false, message: 'Err. Campos vacios: Todos los campos son obligatorios.'}

    products.push(product);
    await this.#saveProducts(products);

    return { status: true, product: product }
  }

  async deleteProductById(id) {
    const products = await this.getProducts();
    let deletedProduct;

    if (!this.#product_exists(products, id))
      return false

    products.forEach((product) => {
      if (Object.values(product).includes(id)) {
        deletedProduct = product
        const index = products.indexOf(product);
        products.splice(index, 1)
      }
    });

    await this.#saveProducts(products);
    return deletedProduct;
  }

  async updateProduct(id, data) {

    const products = await this.getProducts();
    const dataKeys = Object.keys(data);
    let updatedProduct;

    if (!this.#product_exists(products, id))
      return {status: false, message: 'Err. No existe: No existe un producto con este ID.'}
    if(dataKeys.includes('code')){
      if (this.#code_exists(data.code, products))
      return {status: false, message: 'Err. Codigo duplicado: Ya existe un producto con este codigo.'}
    }
    
      products.forEach((product) => {
      if (Object.values(product).includes(id)) {
        dataKeys.forEach((key) => {
          if (key !== "id") {
            product[key] = data[key];
          }
        });
      }
    });

    this.#saveProducts(products);
    return {status: true, product: updatedProduct}
  }

  #generateId(products) {
    let id = 0;
    products.forEach((product) => {
      if (id <= product.id) id++;
    });
    return id + 1;
  }

  #code_exists(code, products) {
    const exists = products.some((product) => {
      return product.code === code;
    });

    return exists;
  }

  #validate_fields(product) {
    const result = Object.values(product).some((value) => {
      return value === null || value === undefined || value === "";
    });

    return result;
  }

  #product_exists(products, id) {
    const product_exists = products.some((product) => {
      return product.id === id;
    });

    return product_exists;
  }

  #getProductsLimited(products, limit) {
    let limitedProducts = [];
    limit = limit > products.length ? products.length : limit
    for (let i = 0; i < limit; i++) {
      limitedProducts.push(products[i])
    }
    return limitedProducts
  }

  async #saveProducts(products) {
    try {
      if (products != []) {
        await fs.promises.writeFile(this.path, JSON.stringify(products));
      } else {
        return console.log(
          "Err. de guardado: No hay ningun producto para guardar."
        );
      }
    } catch (error) {
      return console.log(
        "Err. de guardado: Ha ocurrido un error al guardar los datos."
      );
    }
  }

}

module.exports = { ProductManager };