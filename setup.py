import os
from setuptools import setup, find_packages
from distutils.dir_util import copy_tree

with open("README.md", "r") as fh:
    long_description = fh.read()

with open('requirements.txt') as f:
    install_requires = f.read().strip().split('\n')

setup(
    name="utk",
    version="0.8.8",
    author="Fabio Miranda",
    author_email="fabiom@uic.edu",
    description="The Urban Toolkit: A Grammar-based Framework for Urban Visual Analytics",
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/urban-toolkit/utk/',
    packages=['utk'],
    package_dir = {
        'utk': './src/utk'
    },
    package_data={'utk': ['../utk_server.py', '../utk-frontend/build/utk-app/*', '../../requirements.txt']},
    include_package_data=True,
    entry_points={
        'console_scripts': [
            'utk = utk_server:main',
        ],
    },
    license_files = ('LICENSE'),
    python_requires='>=3.9',
    install_requires=install_requires
)
