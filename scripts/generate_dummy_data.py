import pandas as pd
import os

# Define the schema
COLUMNS = ['Barcode', 'Book Name', 'Author', 'Department', 'Status', 'Shelf']

# Sample data
data = [
    ['LIB-1001', 'Python for Robotics', 'John Doe', 'Computer Science', 'Available', 'C1'],
    ['LIB-1002', 'Linear Algebra', 'Gilbert Strang', 'Mathematics', 'Available', 'H1'],
    ['LIB-1003', 'Circuit Analysis', 'Hayt & Kemmerly', 'Electronics', 'Available', 'F1'],
    ['LIB-1004', 'Machine Learning', 'Andrew Ng', 'Computer Science', 'Available', 'C1'],
    ['LIB-1005', 'Data Structures', 'Mark Allen Weiss', 'Computer Science', 'Available', 'C1']
]

# Create DataFrame
df = pd.DataFrame(data, columns=COLUMNS)

# Save to the data directory
target_path = r'd:\projects\final_lib\data\books_database_sample.xlsx'
if not os.path.exists(os.path.dirname(target_path)):
    os.makedirs(os.path.dirname(target_path))

df.to_excel(target_path, index=False)
print(f"Sample database created at {target_path}")
