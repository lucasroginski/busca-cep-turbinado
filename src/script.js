function pesquisarCep() {
    var cep = document.getElementById("ce").value.replace(/\D/g, '');
    var resultado = document.getElementById("resultado");
    if (!cep || cep.length != 8) {
        resultado.innerHTML = '<p style="color: red">CEP inválido! digite 8 números</p>';
        return;

    }
    fetch(`https://viacep.com.br/ws/${cep}/json`)
        .then(response => response.json())
        .then(data => {
            if (data.erro) {
                resultado.innerHTML = '<p style="color: red">CEP não encontrado!</p>';
                return;
            }else{
                resultado.innerHTML=`<p><strong>Logradouro: </strong>${data.logradouro}</p>
                <p><strong>Bairro: </strong>${data.bairro}</p>
                <p><strong>Cidade: </strong>${data.localidade}</p>
                <p><strong>Estado: </strong>${data.uf}</p>`;
           }


        })
}