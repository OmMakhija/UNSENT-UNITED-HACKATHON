"""
Test script to verify socket handlers are registered
Run this in your backend directory
"""

# Check if sockets.py has the correct functions
try:
    from sockets import register_socket_handlers
    print("✅ register_socket_handlers found in sockets.py")
    
    # Check if it has the right signature
    import inspect
    sig = inspect.signature(register_socket_handlers)
    print(f"✅ Function signature: {sig}")
    
except ImportError as e:
    print(f"❌ Error importing: {e}")
except Exception as e:
    print(f"❌ Error: {e}")

# Check if app.py is calling it
try:
    with open('app.py', 'r') as f:
        app_content = f.read()
        
    if 'register_socket_handlers' in app_content:
        print("✅ app.py calls register_socket_handlers")
    else:
        print("❌ app.py does NOT call register_socket_handlers")
        print("    You need to add this to app.py!")
        
    if 'from sockets import' in app_content:
        print("✅ app.py imports from sockets")
    else:
        print("❌ app.py does NOT import from sockets")
        
except Exception as e:
    print(f"❌ Error reading app.py: {e}")