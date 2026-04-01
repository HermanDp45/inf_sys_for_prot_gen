def generate_mock_pdb(length=100):
    """Generate mock PDB content for demonstration"""
    pdb_lines = []
    for i in range(1, length + 1):
        x = round(10.0 + i * 0.5, 3)
        y = round(5.0 + i * 0.3, 3)
        z = round(2.0 + i * 0.2, 3)
        pdb_lines.append(f"ATOM  {i:5d}  CA  ALA A{i:4d}    {x:8.3f}{y:8.3f}{z:8.3f}  1.00  0.00           C  ")
    pdb_lines.append("END")
    return "\n".join(pdb_lines)
