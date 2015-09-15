//helper functions
	function getNewMatrix(width, height) {
		switch (width) {
			case 1:
				switch (height) {
					case 1:
						return new Matrix1x1();
					case 2:
						return new Matrix1x2();
					case 3:
						return new Matrix1x3();
					case 4:
						return new Matrix1x4();
				}
				break;
			case 2:
				switch (height) {
					case 1:
						return new Matrix2x1();
					case 2:
						return new Matrix2x2();
					case 3:
						return new Matrix2x3();
					case 4:
						return new Matrix2x4();
				}
				break;
			case 3:
				switch (height) {
					case 1:
						return new Matrix3x1();
					case 2:
						return new Matrix3x2();
					case 3:
						return new Matrix3x3();
					case 4:
						return new Matrix3x4();
				}
				break;
			case 4:
				switch (height) {
					case 1:
						return new Matrix4x1();
					case 2:
						return new Matrix4x2();
					case 3:
						return new Matrix4x3();
					case 4:
						return new Matrix4x4();
				}
				break;
		}
		throw "No matrix with width (" + width + ") and height (" + height + ") available.";
	}
	function diagonalOnlyZeros(m) {
		var onlyZero = true;

		//test if the diagonal has other values than 0
		for (var i = 0; i < m.w && i < m.h && onlyZero; i++) {
			onlyZero = onlyZero && m.d[i*m.w + i] == 0;
		}

		return onlyZero;
	}
	function getParts(src, split) {
		var result = [];

		var m = split;
		var n = src.w - split;

		//create matrix's parts
		result[0] = getNewMatrix(m, m);
		result[1] = getNewMatrix(n, m);
		result[2] = getNewMatrix(m, n);
		result[3] = getNewMatrix(n, n);

		//fill matrix's parts
		for (var iy = 0; iy < src.h; iy++) {
			for (var ix = 0; ix < src.w; ix++) {
				//translate index to parts index
				var i = 0;
				var x = 0;
				var y = 0;
				if (iy < m && ix < m) {
					//part 0
					i = 0;
					x = ix;
					y = iy;
				} else if (iy < m) {
					//part 1
					i = 1;
					x = ix - m;
					y = iy;
				} else if (ix < m) {
					//part 2
					i = 2;
					x = ix;
					y = iy - m;
				} else {
					//part 3
					i = 3;
					x = ix - m;
					y = iy - m;
				}

				//copy data from source to part
				result[i].d[y*result[i].w + x] = src.d[iy*src.w + ix];
			}
		}

		return result;
	}
	function fillMatrixWithParts(dest, parts) {
		for (var iy = 0; iy < dest.h; iy++) {
			for (var ix = 0; ix < dest.w; ix++) {
				//translate index to parts index
				var i = 0;
				var x = 0;
				var y = 0;
				if (iy < m && ix < m) {
					//part 0
					i = 0;
					x = ix;
					y = iy;
				} else if (iy < m) {
					//part 1
					i = 1;
					x = ix - m;
					y = iy;
				} else if (ix < m) {
					//part 2
					i = 2;
					x = ix;
					y = iy - m;
				} else {
					//part 3
					i = 3;
					x = ix - m;
					y = iy - m;
				}

				//copy data from part to destination
				dest.d[iy*dest.w + ix] = parts[i].d[y*parts[i].w + x];
			}
		}
	}

//Super-class
	function Matrix(n, m) {
		this.d = new Float32Array(n*m);
		this.w = n;
		this.h = m;
		for (var iy = 0; iy < this.h; iy++) {
			for (var ix = 0; ix < this.w; ix++) {
				if (ix == iy) {
					this.d[iy*this.w + ix] = 1;
				} else {
					this.d[iy*this.w + ix] = 0;
				}
			}
		}
	}

//Defining super-class methods
	Matrix.prototype.makeNew  = function() {
		return new Matrix(0, 0);
	}
	Matrix.prototype.inverse  = function() {
		//The used method needs invertable values (non-zero) on the diagonal.
		//Beside that a matrix has to be square to be invertable.
		if (diagonalOnlyZeros(this) || this.w != this.h) {
			throw "This matrix is not invertable.";
		}

		//The used method splits the matix in four parts.
		//The four parts are two squares (A and D) and two ractangles (B and C).
		//
		// A B
		// C D
		//
		//Either A or D have to be be invertable.
		//A and D are tested in different sizes starting with 1x1 to (n-1)(n-1).

		// Mathematical explanation:
		// It works the same for D just the other way around.
		//
		// a b | 1 0
		// c d | 0 1
		//
		// a b     | 1    0
		// 0 d-c/a | -c/a 1
		//
		// s = d-c/a
		//
		// a b | 1    0
		// 0 s | -c/a 1
		//
		// a 0 | 1+bc/as -b/s
		// 0 s | -c/a       1
		//
		// 1 0 | 1/a+bc/aas -b/as
		// 0 1 | -c/as        1/s
		//
		// (a^-1)+bc(a^-2)(s^-1) -b(a^-1)(s^-1)
		// -c(a^-1)(s^-1)                (s^-1)
		//
		// x = a^-1
		// y = s^-1
		//
		// x+bcxxy -bxy
		// -cxy       y

		var inverted = false;
		//result-matrix
		var r = this.makeNew();
		var split = 1;
		while (!inverted && split < r.w) {
			var parts = getParts(this, split);
			var newParts = [];

			var A = parts[0];
			var B = parts[1];
			var C = parts[2];
			var D = parts[3];

			//Try A is invertable
			try {
				//A^-1
				var invA = A.inverse();
				//D - C*A^-1*B
				var sub  = D.add(C.mul(invA).mul(B).neg());
				var invS = sub.inverse();

				//A^-1 + A^-1*B*S^-1*C*A^-1
				var newA = invA.add(invA.mul(B).mul(invS).mul(C).mul(invA));

				//-A^-1*B*S^-1
				var newB = invA.mul(B).mul(invS).neg();

				//-S^-1*C*A^-1
				var newC = invS.mul(c).mul(invA).neg();

				//S^-1
				var newD = invS;

				inverted = true;
				newParts[0] = newA;
				newParts[1] = newB;
				newParts[2] = newC;
				newParts[3] = newD;
			} catch (e) {
				//try if D is invertable
			}

			if (!inverted) {
				//Try D is invertable
				try {
					//D^-1
					var invD = D.inverse();
					//A - B*D^-1*C
					var sub  = A.add(B.mul(invD).mul(C).neg());
					var invS = sub.inverse();

					//S^-1
					var newA = invS;

					//-S^-1*B*D^-1
					var newB = invS.mul(B).mul(invD).neg();

					//-D^-1*C*S^-1
					var newC = invD.mul(c).mul(invS).neg();

					//D^-1 + D^-1*C*S^-1*B*D^-1
					var newD = invS.add(invD.mul(C).mul(invS).mul(B).mul(invD));

					inverted = true;
					newParts[0] = newA;
					newParts[1] = newB;
					newParts[2] = newC;
					newParts[3] = newD;
				} catch (e) {
					//did not work this time.
					split++;
				}
			}

			fillMatrixWithParts(r, newParts);
		}

		if (!inverted) {
			throw "This matrix is not invertable.";
		}


	}
	Matrix.prototype.scale    = function(s) {
		var m = this.makeNew();

		for (var iy = 0; iy < m.h; iy++) {
			for (var ix = 0; ix < m.w; ix++) {
				m.d[iy*m.w + ix] = s * this.d[iy*this.w + ix];
			}
		}

		return m;
	}
	Matrix.prototype.add      = function(m) {
		//check if the matrices have the same size
		if(this.w != m.w || this.h != m.h) {
			throw 'Matrices are NOT addable.'
		}

		//result-matrix
		var r = this.makeNew();

		for (var iy = 0; iy < r.h; iy++) {
			for (var ix = 0; ix < r.w; ix++) {
				r.d[iy*r.w + ix] = this.d[iy*this.w + ix] + m.d[iy*m.w + ix];
			}
		}

		return m;
	}
	Matrix.prototype.neg      = function() {
		//result-matrix
		var r = this.makeNew();

		for (var iy = 0; iy < r.h; iy++) {
			for (var ix = 0; ix < r.w; ix++) {
				r.d[iy*r.w + ix] = -this.d[iy*this.w + ix];
			}
		}

		return m;
	}
	Matrix.prototype.mul      = function(m) {
		//check if the matrices are multipliable
		if(this.w != m.h) {
			throw 'Matrices are NOT multipliable.'
		}

		//result-matrix
		var r = getNewMatrix(this.w, m.h);
		//number of iterations per field of the result-matrix
		var numIter = this.w;

		//iterates the new matrix's rows
		for (var iy = 0; iy < r.h; iy++) {
			//iterates the rows' fileds
			for (var ix = 0; ix < r.w; ix++) {
				var sum = 0;

				//iterate the multiplications
				//  for each field in the result-matrix you have to sum
				//  the product of a row (of this) and a column (of m).
				//  the row    is difined via iy*(matrix's width)
				//  the column is difined via ix
				//  each filed can be addressed via (row's number)*(matix's width) + (column's number)
				for (var im = 0; im < numIter; im++) {
					sum = sum + this.d[iy*this.w + im] * m.d[im*m.w + ix];
				}

				r.d[iy*r.w + ix] = sum;
			}
		}

		return r;
	}

//-------------------------------------------------------------------------------//
// The non-square matrices are dummy classes used for inverting square matrices. //
// The non-square matrices are therefore implemented with less functions.        //
//-------------------------------------------------------------------------------//

//Sub-classes (category 1x)
	function Matrix1x1() {
		Matrix.call(this, 1, 1);
	}
	function Matrix1x2() {
		Matrix.call(this, 1, 2);
	}
	function Matrix1x3() {
		Matrix.call(this, 1, 3);
	}
	function Matrix1x4() {
		Matrix.call(this, 1, 4);
	}

//Sub-classes (category 2x)
	function Matrix2x1() {
		Matrix.call(this, 2, 1);
	}
	function Matrix2x2() {
		Matrix.call(this, 2, 2);
	}
	function Matrix2x3() {
		Matrix.call(this, 2, 3);
	}
	function Matrix2x4() {
		Matrix.call(this, 2, 4);
	}

//Sub-classes (category 3x)
	function Matrix3x1() {
		Matrix.call(this, 3, 1);
	}
	function Matrix3x2() {
		Matrix.call(this, 3, 2);
	}
	function Matrix3x3() {
		Matrix.call(this, 3, 3);
	}
	function Matrix3x4() {
		Matrix.call(this, 3, 4);
	}

//Sub-classes (category 4x)
	function Matrix4x1() {
		Matrix.call(this, 4, 1);
	}
	function Matrix4x2() {
		Matrix.call(this, 4, 2);
	}
	function Matrix4x3() {
		Matrix.call(this, 4, 3);
	}
	function Matrix4x4() {
		Matrix.call(this, 4, 4);
	}

//binding Super-class and Sub-classes (category 1x)
	inheritPseudoClass(Matrix, Matrix1x1);
	inheritPseudoClass(Matrix, Matrix1x2);
	inheritPseudoClass(Matrix, Matrix1x3);
	inheritPseudoClass(Matrix, Matrix1x4);

//binding Super-class and Sub-classes (category 2x)
	inheritPseudoClass(Matrix, Matrix2x1);
	inheritPseudoClass(Matrix, Matrix2x2);
	inheritPseudoClass(Matrix, Matrix2x3);
	inheritPseudoClass(Matrix, Matrix2x4);

//binding Super-class and Sub-classes (category 3x)
	inheritPseudoClass(Matrix, Matrix3x1);
	inheritPseudoClass(Matrix, Matrix3x2);
	inheritPseudoClass(Matrix, Matrix3x3);
	inheritPseudoClass(Matrix, Matrix3x4);

//binding Super-class and Sub-classes (category 4x)
	inheritPseudoClass(Matrix, Matrix4x1);
	inheritPseudoClass(Matrix, Matrix4x2);
	inheritPseudoClass(Matrix, Matrix4x3);
	inheritPseudoClass(Matrix, Matrix4x4);

//implement basic functions (category 1x)
	Matrix1x1.make              = function(m11) {
		//result-matrix
		var r = new Matrix1x1();

		//first row
			r.d[0] = m11;

		return r;
	}
	Matrix1x1.prototype.makeNew = function() {
		return new Matrix1x1();
	}
	Matrix1x1.prototype.inverse = function() {
		//result-matrix
		var r = this.makeNew();

		r.d[0] = 1/this.d[0];

		return r;
	}
	Matrix1x2.make              = function(m11, m21) {
		//result-matrix
		var r = new Matrix1x2();

		//first row
			r.d[0] = m11;
		//second row
			r.d[1] = m21;

		return r;
	}
	Matrix1x2.prototype.makeNew = function() {
		return new Matrix1x2();
	}
	Matrix1x3.make              = function(m11, m21, m31) {
		//result-matrix
		var r = new Matrix1x3();

		//first row
			r.d[0] = m11;
		//second row
			r.d[1] = m21;
		//third row
			r.d[2] = m31;

		return r;
	}
	Matrix1x3.prototype.makeNew = function() {
		return new Matrix1x3();
	}
	Matrix1x4.make              = function(m11, m21, m31, m41) {
		//result-matrix
		var r = new Matrix1x4();

		//first row
			r.d[0] = m11;
		//second row
			r.d[1] = m21;
		//third row
			r.d[2] = m31;
		//fourth row
			r.d[3] = m41;

		return r;
	}
	Matrix1x4.prototype.makeNew = function() {
		return new Matrix1x4();
	}

//implement basic functions (category 2x)
	Matrix2x1.make              = function(m11, m12) {
		//result-matrix
		var r = new Matrix2x1();

		//first row
			r.d[0] = m11;
			r.d[1] = m12;

		return r;
	}
	Matrix2x1.prototype.makeNew = function() {
		return new Matrix2x1();
	}
	Matrix2x2.make              = function(m11, m12,
										   m21, m22) {
		//result-matrix
		var r = new Matrix2x2();

		//first row
			r.d[0] = m11;
			r.d[1] = m12;
		//second row
			r.d[2] = m21;
			r.d[3] = m22;

		return r;
	}
	Matrix2x2.makeRotate2D      = function(angle) {
		//result-matrix
		var r = new Matrix2x2();

		var s = Math.sin(angle);
		var c = Math.cos(angle);

		r.d[0] =  c;
		r.d[1] = -s;
		r.d[2] =  s;
		r.d[3] =  c;

		return r;
	}
	Matrix2x2.prototype.makeNew = function() {
		return new Matrix2x2();
	}
	Matrix2x3.make              = function(m11, m12,
										   m21, m22,
										   m31, m32) {
	   	//result-matrix
	   	var r = new Matrix2x3();

		//first row
			r.d[0] = m11;
			r.d[1] = m12;
		//second row
			r.d[2] = m21;
			r.d[3] = m22;
		//third row
			r.d[4] = m31;
			r.d[5] = m32;

		return r;
	}
	Matrix2x3.prototype.makeNew = function() {
		return new Matrix2x3();
	}
	Matrix2x4.make              = function(m11, m12,
										   m21, m22,
										   m31, m32,
									 	   m41, m42) {
		//result-matrix
		var r = new Matrix2x4();

		//first row
			r.d[0] = m11;
			r.d[1] = m12;
		//second row
			r.d[2] = m21;
			r.d[3] = m22;
		//third row
			r.d[4] = m31;
			r.d[5] = m32;
		//fourth row
			r.d[6] = m41;
			r.d[7] = m42;

		return r;
	}
	Matrix2x4.prototype.makeNew = function() {
		return new Matrix2x4();
	}

//implement basic functions (category 3x)
	Matrix3x1.make              = function(m11, m12, m13) {
		//result-matrix
		var r = new Matrix3x1();

		//first row
			r.d[0] = m11;
			r.d[1] = m12;
			r.d[2] = m13;

		return r;
	}
	Matrix3x1.prototype.makeNew = function() {
		return new Matrix3x1();
	}
	Matrix3x2.make              = function(m11, m12, m13,
										   m21, m22, m23) {
		//result-matrix
		var r = new Matrix3x2();

		//first row
			r.d[0] = m11;
			r.d[1] = m12;
			r.d[2] = m13;
		//first row
			r.d[3] = m21;
			r.d[4] = m22;
			r.d[5] = m23;

		return r;
	}
	Matrix3x2.prototype.makeNew = function() {
		return new Matrix3x2();
	}
	Matrix3x3.make              = function(m11, m12, m13,
										   m21, m22, m23,
										   m31, m32, m33) {
		//result-matrix
		var r = new Matrix3x3();

		//first row
	   		r.d[0] = m11;
	   		r.d[1] = m12;
	   		r.d[2] = m13;
	   	//second row
	   		r.d[3] = m21;
	   		r.d[4] = m22;
	   		r.d[5] = m23;
	   	//third row
	   		r.d[6] = m31;
	   		r.d[7] = m32;
	   		r.d[8] = m33;

	   	return r;
	}
	Matrix3x3.makeRotate2D      = function(angle) {
		//result-matrix
		var r = new Matrix3x3();

		//sinus value of the angle
		var s = Math.sin(angle);
		//cosinus value of the angle
		var c = Math.cos(angle);

		//first row
			r.d[0] =  c;
			r.d[1] = -s;
			r.d[2] =  0;
		//second row
			r.d[3] =  s;
			r.d[4] =  c;
			r.d[5] =  0;
		//third row (additional)
			r.d[6] =  0;
			r.d[7] =  0;
			r.d[8] =  1;

		return r;
	}
	Matrix3x3.makeRotate3D      = function(angle, x, y, z) {
		//rotate around any vector

		//result-matrix
		var r = new Matrix3x3();

		//length of the vector
		var vecLen = Math.sqrt(x*X + y*y + z*z);
		//normalize the vector (divide each part by the length)
		var n = { x : x / vecLen, y : y / vecLen, z : z / vecLen };
		//sinus value of the angle
		var s = Math.sin(angle);
		//cosinus value of the angle
		var c = Math.cos(angle);
		//
		var t = 1 - c;

		//reference to look up the matrix:
		//  https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
		//first row
			//(1-c)*nx^2  + c
			r.d[0] = t*n.x*n.x + c;
			//(1-c)*nx*ny + c*nz
			r.d[1] = t*n.x*n.y + c*n.z;
			//(1-c)*nx*nz + c*ny
			r.d[2] = t*n.x*n.z + c*n.y;
		//second row
			//(1-c)*nx*ny + c*nz
			r.d[3] = t*n.x*n.y + c*n.z;
			//(1-c)*ny^2  + c
			r.d[4] = t*n.y*n.y + c;
			//(1-c)*ny*nz + c*nx
			r.d[5] = t*n.y*n.z + c*n.x;
		//third row
			//(1-c)*nx*nz + c*ny
			r.d[6] = t*n.x*n.z + c*n.y;
			//(1-c)*ny*nz + c*nx
			r.d[7] = t*n.y*n.z + c*n.x;
			//(1-c)*nz^2  + c
			r.d[8] = t*n.z*n.z + c;

		return r;
	}
	Matrix3x3.makeRotate3DX     = function(angle) {
		//rotate around the x-axis
		return makeRotate3D(angle, 1, 0, 0);
	}
	Matrix3x3.makeRotate3DY     = function(angle) {
		//rotate around the y-axis
		return makeRotate3D(angle, 0, 1, 0);
	}
	Matrix3x3.makeRotate3DZ     = function(angle) {
		//rotate around the z-axis
		return makeRotate3D(angle, 0, 0, 1);
	}
	Matrix3x3.prototype.makeNew = function() {
		return new Matrix3x3();
	}
	Matrix3x4.make              = function(m11, m12, m13,
										   m21, m22, m23,
									       m31, m32, m33,
									       m41, m42, m43) {
		//result-matrix
		var r = new Matrix3x4();

		//first row
			r.d[ 0] = m11;
			r.d[ 1] = m12;
			r.d[ 2] = m13;
		//first row
			r.d[ 3] = m21;
			r.d[ 4] = m22;
			r.d[ 5] = m23;
		//third row
			r.d[ 6] = m31;
			r.d[ 7] = m32;
			r.d[ 8] = m33;
		//fourth row
			r.d[ 9] = m41;
			r.d[10] = m42;
			r.d[11] = m43;

		return r;
	}
	Matrix3x4.prototype.makeNew = function() {
		return new Matrix3x4();
	}

//implement basic functions (category 4x)
	Matrix4x1.make              = function(m11, m12, m13, m14) {
		//result-matrix
		var r = new Matrix4x1();

		//first row
			r.d[0] = m11;
			r.d[1] = m12;
			r.d[2] = m13;
			r.d[3] = m14;

		return r;
	}
	Matrix4x1.prototype.makeNew = function() {
		return new Matrix4x1();
	}
	Matrix4x2.make              = function(m11, m12, m13, m14,
										   m21, m22, m23, m24) {
		//result-matrix
		var r = new Matrix4x2();

		//first row
			r.d[0] = m11;
			r.d[1] = m12;
			r.d[2] = m13;
			r.d[3] = m14;
		//second row
			r.d[4] = m21;
			r.d[5] = m22;
			r.d[6] = m23;
			r.d[7] = m24;

		return r;
	}
	Matrix4x2.prototype.makeNew = function() {
		return new Matrix4x2();
	}
	Matrix4x3.make              = function(m11, m12, m13, m14,
										   m21, m22, m23, m24,
									       m31, m32, m33, m34) {
		//result-matrix
		var r = new Matrix4x3();

		//first row
			r.d[ 0] = m11;
			r.d[ 1] = m12;
			r.d[ 2] = m13;
			r.d[ 3] = m14;
		//second row
			r.d[ 4] = m21;
			r.d[ 5] = m22;
			r.d[ 6] = m23;
			r.d[ 7] = m24;
		//third row
			r.d[ 8] = m31;
			r.d[ 9] = m32;
			r.d[10] = m33;
			r.d[11] = m34;

		return r;
	}
	Matrix4x3.prototype.makeNew = function() {
		return new Matrix4x3();
	}
	Matrix4x4.make              = function(m11, m12, m13, m14,
										   m21, m22, m23, m24,
										   m31, m32, m33, m34,
										   m41, m42, m43, m44) {
		//result-matrix
		var r = new Matrix4x4();

		//first row
			r.d[ 0] = m11;
			r.d[ 1] = m12;
			r.d[ 2] = m13;
			r.d[ 3] = m14;
		//second row
			r.d[ 4] = m21;
			r.d[ 5] = m22;
			r.d[ 6] = m23;
			r.d[ 7] = m24;
		//third row
			r.d[ 8] = m31;
			r.d[ 9] = m32;
			r.d[10] = m33;
			r.d[11] = m34;
		//fourth row
			r.d[12] = m41;
			r.d[13] = m42;
			r.d[14] = m43;
			r.d[15] = m44;

		return r;
	}
	Matrix4x4.makeRotate3D      = function(angle, x, y, z) {
		//rotate around any vector

		//length of the vector
		var vecLen = Math.sqrt(x*X + y*y + z*z);
		//normalize the vector (divide each part by the length)
		var n = { x : x / vecLen, y : y / vecLen, z : z / vecLen };
		//sinus value of the angle
		var s = Math.sin(angle);
		//cosinus value of the angle
		var c = Math.cos(angle);
		//
		var t = 1 - c;

		//reference to look up the matrix:
		//  https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
		//first row
			//(1-c)*nx^2  + c
			this.d[ 0] = t*n.x*n.x + c;
			//(1-c)*nx*ny + c*nz
			this.d[ 1] = t*n.x*n.y + c*n.z;
			//(1-c)*nx*nz + c*ny
			this.d[ 2] = t*n.x*n.z + c*n.y;
			//additional column
			this.d[ 3] = 0;
		//second row
			//(1-c)*nx*ny + c*nz
			this.d[ 4] = t*n.x*n.y + c*n.z;
			//(1-c)*ny^2  + c
			this.d[ 5] = t*n.y*n.y + c;
			//(1-c)*ny*nz + c*nx
			this.d[ 6] = t*n.y*n.z + c*n.x;
			//additional column
			this.d[ 7] = 0;
		//third row
			//(1-c)*nx*nz + c*ny
			this.d[ 8] = t*n.x*n.z + c*n.y;
			//(1-c)*ny*nz + c*nx
			this.d[ 9] = t*n.y*n.z + c*n.x;
			//(1-c)*nz^2  + c
			this.d[10] = t*n.z*n.z + c;
			//additional column
			this.d[11] = 0;
		//fourth row (additional)
			this.d[12] = 0;
			this.d[13] = 0;
			this.d[14] = 0;
			this.d[15] = 1;

		return this;
	}
	Matrix4x4.makeRotate3DX     = function(angle) {
		//rotate around the x-axis
		return makeRotate3D(angle, 1, 0, 0);
	}
	Matrix4x4.makeRotate3DY     = function(angle) {
		//rotate around the y-axis
		return makeRotate3D(angle, 0, 1, 0);
	}
	Matrix4x4.makeRotate3DZ     = function(angle) {
		//rotate around the z-axis
		return makeRotate3D(angle, 0, 0, 1);
	}
	Matrix4x4.makePerspective   = function(fovy, aspect, znear, zfar) {
		var top = znear * Math.tan(fovy * Math.PI / 360.0);
		var bottom = -top;
		var left = bottom * aspect;
		var right = top * aspect;

		var X = 2*znear/(right-left);
		var Y = 2*znear/(top-bottom);
		var A = (right+left)/(right-left);
		var B = (top+bottom)/(top-bottom);
		var C = -(zfar+znear)/(zfar-znear);
		var D = -2*zfar*znear/(zfar-znear);

		this.make(X,0,0,0, 0,Y,0,0, A,B,C,-1, 0,0,D,0);
		return this;
	}
	Matrix4x4.prototype.makeNew = function() {
		return new Matrix4x4();
	}

globalGLMatrix = {
	//different transformations for different objects
	//can be nested and therefore a array.
	transformMatrix : [ new Matrix4x4() ],
	//points to the last transformation-matrix.
	transformStackTop : 0,
	//holds the depth-transformation.
	projectionMatrix : new Matrix4x4().makePerspective(45,1,0.01,100),
	//holds the camaras transformations.
	viewMatrix : new Matrix4x4()
};
function transformMatrix() {
	//return the last added transformMatrix
	return globalGLMatrix.transformMatrix[globalGLMatrix.transformStackTop];
}
function pushTransformMatrix(m) {
	globalGLMatrix.transformMatrix[++globalGLMatrix.transformStackTop] = m;
}
function popModelMatrix(argument) {
	--globalGLMatrix.transformStackTop;
}
function projectionMatrix() {
	return globalGLMatrix.projectionMatrix;
}
function viewMatrix() {
	return globalGLMatrix.viewMatrix;
}
