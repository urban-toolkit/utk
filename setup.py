from setuptools import setup, find_packages

with open("README.md", "r") as fh:
    long_description = fh.read()

setup(
    name="urbantk",
    version="0.0.1",
    author="Fabio Miranda",
    author_email="fabiom@uic.edu",
    description="The Urban Toolkit: A Grammar-based Framework for Urban Visual Analytics",
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/urban-toolkit/urbantk/tree/main/',
    packages=find_packages(exclude=['node_modules']),
    include_package_data=True,
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: BSD License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.9',
    install_requires=[
        'notebookjs',
    ]
)
