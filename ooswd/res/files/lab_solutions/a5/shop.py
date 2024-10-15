from product import Product

class Shop:
    template = "{0: <4}{1: <12}{2: <23}{3: <}"

    def __init__(self, data):
        self.products = list(map(lambda p: Product(*p), data))

    def add_product(self, name, desc, stock):
        self.products.append(Product(name, desc, stock))

    def remove_product(self, name):
        index = list(map(lambda p: p.name, self.products)).index(name)
        self.products.pop(index)

    def print_heading(self, listname):
        print("")
        print("=============== {} ===============".format(listname))
        print(self.template.format("ID", "Name", "Description", "Stock"))
        
    def print_product_list(self):
        self.print_heading("ALL PRODUCTS")
        for index, p in enumerate(self.products):
            print(self.template.format(index + 1, p.name, p.description, p.stock))
            
    def print_low_on_stock(self):
        self.print_heading("LOW ON STOCK")
        for index, p in enumerate(list(filter(lambda p: p.stock < 3, self.products))):
            print(self.template.format(index + 1, p.name, p.description, p.stock))
        

            

