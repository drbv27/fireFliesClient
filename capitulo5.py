numeros_pares = [2, 4, 6, 8, 10]
vocales = ["a", "e", "i", "o", "u"]
datos_variados = [1.5, "Hola", True, None, 4]
lista_vacia = [] # Muy útil para empezar a llenarla después

print(numeros_pares)
print(vocales)
print(datos_variados)
print(lista_vacia)


otra_vacia = list()
print(otra_vacia)

palabra = "Python"
lista_letras = list(palabra) # Convierte el string en una lista de caracteres
print(lista_letras) # Salida: ['P', 'y', 't', 'h', 'o', 'n']


frutas = ["manzana", "plátano", "cereza", "dátil"]

# Acceder al primer elemento (índice 0)
primera_fruta = frutas[0]
print(f"Primera fruta: {primera_fruta}") # Salida: manzana

# Acceder al tercer elemento (índice 2)
tercera_fruta = frutas[2]
print(f"Tercera fruta: {tercera_fruta}") # Salida: cereza




# Acceder al último elemento (índice -1)
ultima_fruta = frutas[-1]
print(f"Última fruta: {ultima_fruta}") # Salida: dátil

# Acceder al penúltimo elemento (índice -2)
penultima_fruta = frutas[-2]
print(f"Penúltima fruta: {penultima_fruta}") # Salida: cereza




numeros = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
print(f"Original: {numeros}")

# Elementos desde el índice 2 hasta el 4 (el 5 no se incluye)
slice1 = numeros[2:5]
print(f"numeros[2:5]: {slice1}") # Salida: [20, 30, 40]

# Primeros 4 elementos (desde el inicio hasta el índice 3)
slice2 = numeros[:4]
print(f"numeros[:4]: {slice2}") # Salida: [0, 10, 20, 30]

# Desde el índice 6 hasta el final
slice3 = numeros[6:]
print(f"numeros[6:]: {slice3}") # Salida: [60, 70, 80, 90]

# Cada segundo elemento (paso 2)
slice4 = numeros[::2]
print(f"numeros[::2]: {slice4}") # Salida: [0, 20, 40, 60, 80]

# Invertir la lista (crea una copia invertida)
slice5 = numeros[::-1]
print(f"numeros[::-1]: {slice5}") # Salida: [90, 80, ..., 0]

# Copia superficial de toda la lista
copia = numeros[:]
print(f"Copia (numeros[:]): {copia}")
print(f"¿Son la misma lista en memoria? {copia is numeros}") # False (son objetos diferentes)




colores = ["rojo", "verde", "azul"]
print(f"Colores antes: {colores}")
colores[1] = "amarillo" # Reemplaza 'verde' en el índice 1
print(f"Colores después: {colores}")


numeros = [1, 2, 3]
numeros.append(4)
numeros.append(5)
print(f"Después de append: {numeros}") # Salida: [1, 2, 3, 4, 5]




numeros.insert(0, 0) # Inserta 0 al principio (índice 0)
print(f"Después de insert(0, 0): {numeros}") # Salida: [0, 1, 2, 3, 4, 5]
numeros.insert(3, 99) # Inserta 99 en el índice 3
print(f"Después de insert(3, 99): {numeros}") # Salida: [0, 1, 2, 99, 3, 4, 5]




letras = ["a", "b", "c", "a", "d"]
letras.remove("a") # Elimina la primera 'a'
print(f"Después de remove('a'): {letras}") # Salida: ['b', 'c', 'a', 'd']
# letras.remove("z") # ValueError: list.remove(x): x not in list




valores = [10, 20, 30, 40, 50]
elemento_eliminado = valores.pop(2) # Elimina el 30 (índice 2)
print(f"Después de pop(2): {valores}, eliminado: {elemento_eliminado}") # Salida: [10, 20, 40, 50], eliminado: 30
ultimo = valores.pop() # Elimina el último (50)
print(f"Después de pop(): {valores}, eliminado: {ultimo}") # Salida: [10, 20, 40], eliminado: 50




numeros = [0, 1, 2, 3, 4, 5]
del numeros[0] # Elimina el 0
print(f"Después de del numeros[0]: {numeros}") # Salida: [1, 2, 3, 4, 5]
del numeros[1:3] # Elimina elementos en índices 1 y 2 (el 2 y 3)
print(f"Después de del numeros[1:3]: {numeros}") # Salida: [1, 4, 5]





nums = [54, 23, 91, 45, 12]
print(f"Original: {nums}")
nums.sort() # Ordena la lista nums
print(f"Después de sort(): {nums}")
nums.sort(reverse=True) # Ordena en orden descendente
print(f"Después de sort(reverse=True): {nums}")

nombres = ["Zoe", "Alex", "Maria"]
nombres.sort()
print(f"Nombres ordenados: {nombres}")



elementos = [1, 2, 3, 4]
elementos.reverse()
print(f"Después de reverse(): {elementos}") # Salida: [4, 3, 2, 1]



mi_lista_original = [30, 10, 50]
lista_nueva_ordenada = sorted(mi_lista_original)
print(f"Original: {mi_lista_original}")
print(f"Nueva ordenada: {lista_nueva_ordenada}")




a = [1, 2]
b = [3, 4]
c = a + b  # c es [1, 2, 3, 4]
d = a * 3  # d es [1, 2, 1, 2, 1, 2]
print(f"Concatenación: {c}")
print(f"Repetición: {d}")
print(f"¿Está 3 en c? {3 in c}") # True
print(f"¿No está 5 en c? {5 not in c}") # True




datos = [15, -2, 45, 8, 23]
print(f"Datos: {datos}")
print(f"Cantidad: {len(datos)}")    # 5
print(f"Mínimo: {min(datos)}")    # -2
print(f"Máximo: {max(datos)}")    # 45
print(f"Suma: {sum(datos)}")      # 89



tareas = ["Lavar ropa", "Hacer compra", "Estudiar Python"]
print("\nMis tareas:")
for tarea in tareas:
    print(f"- {tarea}")
    
    
    
    
punto_3d = (10, 20, 30)
nombres_fijos = ("Admin", "Guest", "User")
tupla_vacia = ()
print(punto_3d)
print(nombres_fijos)
print(tupla_vacia)




otra_vacia_t = tuple()
tupla_desde_lista = tuple([1, 2, 3]) # Convierte la lista
print(tupla_desde_lista) # Salida: (1, 2, 3)



no_es_tupla = (50)
print(type(no_es_tupla)) # Salida: <class 'int'>

si_es_tupla = (50,) # ¡La coma es la clave!
print(type(si_es_tupla)) # Salida: <class 'tuple'>
print(si_es_tupla)


mi_tupla = (100, 200, 300, 400)
print(f"Primer elemento: {mi_tupla[0]}")      # 100
print(f"Último elemento: {mi_tupla[-1]}")     # 400
print(f"Slice [1:3]: {mi_tupla[1:3]}")     # (200, 300) -> ¡Devuelve una nueva tupla!




config = ("localhost", 8080)
print(f"Configuración inicial: {config}")

# Intentar cambiar un elemento -> TypeError
try:
    config[0] = "127.0.0.1"
except TypeError as e:
    print(f"Error al intentar modificar: {e}")

# Las tuplas no tienen métodos como append, insert, remove, pop, sort, reverse
# config.append(True) # AttributeError
# del config[0]      # TypeError





t1 = (1, 2)
t2 = (3, 4)
t3 = t1 + t2 # t3 es (1, 2, 3, 4) - Nueva tupla
t4 = t1 * 2  # t4 es (1, 2, 1, 2) - Nueva tupla
print(f"Concatenación: {t3}")
print(f"Repetición: {t4}")
print(f"Longitud de t3: {len(t3)}")



colores_primarios = ("rojo", "verde", "azul")
print("\nColores primarios:")
for color in colores_primarios:
    print(color)





coordenada = (1920, 1080)
ancho, alto = coordenada # Asigna 1920 a ancho, 1080 a alto

print(f"Ancho: {ancho}")
print(f"Alto: {alto}")

# Útil en bucles for también (veremos más con diccionarios)
puntos = [(0, 0), (1, 1), (2, 4)]
for x, y in puntos: # Desempaqueta cada tupla (x,y) de la lista
    print(f"Punto: x={x}, y={y}")
    
    
    


# Solución Ejercicio 1
print("--- Ejercicio 1: Análisis de Números ---")
numeros = [22.5, 10, -5, 100.0, 33]
print(f"Lista original: {numeros}")

cantidad = len(numeros)
minimo = min(numeros)
maximo = max(numeros)
suma = sum(numeros)

# Calcular promedio solo si hay elementos
promedio = suma / cantidad if cantidad > 0 else 0

print(f"Cantidad: {cantidad}")
print(f"Mínimo: {minimo}")
print(f"Máximo: {maximo}")
print(f"Suma: {suma}")
print(f"Promedio: {promedio:.2f}") # Formateado a 2 decimales
print("-" * 20)




# Solución Ejercicio 2
print("--- Ejercicio 2: Buscar Palabra ---")
palabras = ["python", "backend", "curso", "lista", "tupla"]
print(f"Palabras existentes: {palabras}")

palabra_buscar = input("Ingresa una palabra para buscar: ").lower() # Convertir a minúscula

if palabra_buscar in palabras:
    print(f"¡La palabra '{palabra_buscar}' SÍ está en la lista!")
else:
    print(f"La palabra '{palabra_buscar}' NO está en la lista.")
    # Bonus: Añadirla
    palabras.append(palabra_buscar)
    print(f"La hemos añadido. Lista actualizada: {palabras}")
print("-" * 20)


# Solución Ejercicio 3
print("--- Ejercicio 3: Tupla de Coordenadas ---")
punto_inicial = (50, 120)
print(f"Tupla original: {punto_inicial}")

# Acceder a elementos
print(f"Coordenada X: {punto_inicial[0]}")
print(f"Coordenada Y: {punto_inicial[1]}")

# Intentar modificar (causará TypeError)
print("Intentando modificar la tupla...")
try:
    punto_inicial[0] = 75
except TypeError as e:
    print(f"ERROR esperado: {e}")

# Desempaquetar
x_coord, y_coord = punto_inicial
print(f"Desempaquetado -> X: {x_coord}, Y: {y_coord}")
print("-" * 20)